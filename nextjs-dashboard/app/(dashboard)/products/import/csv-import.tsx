'use client';

import React, { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, RotateCcw, Info } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CsvImportProps {
  categories: { id: string; name: string }[];
  selectedCategoryId: string;
}

const COLUMN_ALIASES: Record<string, string[]> = {
  name: ['Name', 'Card Name', 'Product Name', 'Title'],
  set: ['Set', 'Set Name', 'Edition', 'Expansion'],
  condition: ['Condition', 'Cond', 'Grade'],
  quantity: ['Quantity', 'Qty', 'Stock', 'Count'],
  price: ['Price', 'Sell Price', 'Market Price', 'Your Price'],
  foil: ['Foil', 'Printing', 'Finish', 'Is Foil'],
  language: ['Language', 'Lang'],
  collectorNumber: ['Collector Number', 'Number', 'Card Number', '#'],
  rarity: ['Rarity'],
  costPrice: ['Cost', 'Cost Price', 'Buy Price'],
};

const REQUIRED_FIELDS = ['name', 'set'];

type ImportState = 'idle' | 'parsed' | 'enriching' | 'importing' | 'complete';

interface ParsedRow {
  [key: string]: any;
}

interface MappedData {
  [field: string]: any;
}

interface EnrichmentResult {
  image_uris?: { large?: string; normal?: string };
  oracle_id?: string;
  oracle_text?: string;
  legalities?: any;
  mana_cost?: string;
  cmc?: number; // manaValue
  colors?: string[];
  color_identity?: string[];
  type_line?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
}

export default function CsvImport({ categories, selectedCategoryId }: CsvImportProps) {
  const [state, setState] = useState<ImportState>('idle');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Progress states
  const [enrichmentProgress, setEnrichmentProgress] = useState({ current: 0, total: 0 });
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  // Results
  const [results, setResults] = useState({
    success: 0,
    updated: 0,
    errors: [] as { row: number; name: string; error: string }[]
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Please upload a valid .csv file.');
      return;
    }
    
    setErrorMsg(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setErrorMsg('CSV file is empty.');
          return;
        }

        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setParsedData(results.data as ParsedRow[]);
        
        // Auto map columns
        const mapping: Record<string, string> = {};
        for (const field of Object.keys(COLUMN_ALIASES)) {
          const aliases = COLUMN_ALIASES[field].map(a => a.toLowerCase());
          const matchedHeader = headers.find(h => aliases.includes(h.toLowerCase()));
          if (matchedHeader) {
            mapping[field] = matchedHeader;
          }
        }
        
        setColumnMapping(mapping);
        setState('parsed');
      },
      error: (err) => {
        setErrorMsg(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const updateMapping = (field: string, header: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: header === 'unmapped' ? '' : header
    }));
  };

  const isFoil = (val: any): boolean => {
    if (!val) return false;
    const s = String(val).toLowerCase().trim();
    return ['yes', 'true', '1', 'foil'].includes(s);
  };

  const parseNumber = (val: any, defaultVal = 0): number => {
    const n = Number(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(n) ? defaultVal : n;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startImport = async () => {
    if (!selectedCategoryId) {
      setErrorMsg('Please select a category in the sidebar first.');
      return;
    }

    // Validate required fields
    const missing = REQUIRED_FIELDS.filter(f => !columnMapping[f]);
    if (missing.length > 0) {
      setErrorMsg(`Missing mapping for required fields: ${missing.join(', ')}`);
      return;
    }

    setState('enriching');
    setErrorMsg(null);

    // Map data
    const mappedItems = parsedData.map(row => {
      const item: MappedData = {};
      for (const [field, header] of Object.entries(columnMapping)) {
        if (header) {
          item[field] = row[header];
        }
      }
      return item;
    });

    // Extract unique cards for enrichment
    const uniqueCards = new Map<string, { name: string, set: string }>();
    mappedItems.forEach(item => {
      if (item.name) {
        const key = `${item.name}|${item.set || ''}`.toLowerCase();
        uniqueCards.set(key, { name: item.name, set: item.set || '' });
      }
    });

    const uniqueCardsList = Array.from(uniqueCards.values());
    setEnrichmentProgress({ current: 0, total: uniqueCardsList.length });
    
    // Enrichment phase
    const enrichmentCache = new Map<string, EnrichmentResult>();
    
    for (let i = 0; i < uniqueCardsList.length; i++) {
      const card = uniqueCardsList[i];
      setEnrichmentProgress(prev => ({ ...prev, current: i + 1 }));
      
      const cacheKey = `${card.name}|${card.set}`.toLowerCase();
      
      try {
        let query = card.name;
        if (card.set) query += `+set:${card.set}`;
        
        const res = await axios.get(`/api/proxy/mtg?query=${encodeURIComponent(query)}`);
        if (res.data?.data && res.data.data.length > 0) {
          const scryfallData = res.data.data[0]; // Take first match
          enrichmentCache.set(cacheKey, scryfallData);
        }
      } catch (err) {
        console.warn(`Failed to enrich ${card.name}`, err);
      }
      
      await delay(75); // Rate limit
    }

    // Build final payload
    setState('importing');
    setImportProgress({ current: 0, total: mappedItems.length });
    
    const finalItems = mappedItems.map(item => {
      const cacheKey = `${item.name}|${item.set || ''}`.toLowerCase();
      const enriched = enrichmentCache.get(cacheKey) || {};
      
      return {
        name: item.name,
        game: 'MTG',
        categoryId: selectedCategoryId,
        set: item.set || '',
        rarity: item.rarity || 'Common',
        collectorNumber: item.collectorNumber || '',
        price: parseNumber(item.price, 0),
        images: enriched.image_uris?.large ? [enriched.image_uris.large] : [],
        condition: item.condition || 'NM',
        isFoil: isFoil(item.foil),
        language: item.language || 'English',
        quantity: parseNumber(item.quantity, 1),
        costPrice: parseNumber(item.costPrice, 0),
        oracleId: enriched.oracle_id,
        oracleText: enriched.oracle_text,
        legalities: enriched.legalities,
        manaCost: enriched.mana_cost,
        manaValue: enriched.cmc,
        colors: enriched.colors,
        colorIdentity: enriched.color_identity,
        typeLine: enriched.type_line,
        power: enriched.power,
        toughness: enriched.toughness,
        loyalty: enriched.loyalty
      };
    });

    // Chunked import
    const CHUNK_SIZE = 50;
    const chunks = [];
    for (let i = 0; i < finalItems.length; i += CHUNK_SIZE) {
      chunks.push(finalItems.slice(i, i + CHUNK_SIZE));
    }

    let successCount = 0;
    let updatedCount = 0;
    const errorsList = [];
    let itemsProcessed = 0;

    const token = Cookies.get('tcg-auth-token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    for (let i = 0; i < chunks.length; i++) {
      try {
        const res = await axios.post(`${apiUrl}/products/import/batch`, 
          { items: chunks[i] },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        successCount += res.data?.successCount || 0;
        updatedCount += res.data?.updatedCount || 0;
        
        if (res.data?.errors) {
          errorsList.push(...res.data.errors);
        }
      } catch (err: any) {
        console.error('Batch import error:', err);
        const errMsg = err.response?.data?.message || err.message;
        // Mark all in this chunk as failed if batch fails completely
        chunks[i].forEach((item, idx) => {
          errorsList.push({ row: itemsProcessed + idx + 1, name: item.name, error: errMsg });
        });
      }
      
      itemsProcessed += chunks[i].length;
      setImportProgress(prev => ({ ...prev, current: itemsProcessed }));
    }

    setResults({ success: successCount, updated: updatedCount, errors: errorsList });
    setState('complete');
  };

  const reset = () => {
    setState('idle');
    setParsedData([]);
    setCsvHeaders([]);
    setColumnMapping({});
    setResults({ success: 0, updated: 0, errors: [] });
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {state === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>CSV Bulk Import</CardTitle>
            <CardDescription>Upload a CSV file to bulk import cards to your inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Drop CSV file here or click to browse</h3>
              <p className="text-sm text-gray-500">Only .csv files are supported</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileSelect} 
              />
            </div>
          </CardContent>
        </Card>
      )}

      {state === 'parsed' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Column Mapping</CardTitle>
              <CardDescription>Map your CSV columns to the product fields.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(COLUMN_ALIASES).map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-sm font-medium capitalize flex items-center">
                      {field} 
                      {REQUIRED_FIELDS.includes(field) && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <Select 
                      value={columnMapping[field] || 'unmapped'} 
                      onValueChange={(val) => updateMapping(field, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmapped">-- Unmapped --</SelectItem>
                        {csvHeaders.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button onClick={startImport}>
                Start Import ({parsedData.length} cards)
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>Found {parsedData.length} rows in CSV. Showing first 20 rows.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Set</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Foil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 20).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row[columnMapping.name] || '-'}</TableCell>
                      <TableCell>{row[columnMapping.set] || '-'}</TableCell>
                      <TableCell>{row[columnMapping.condition] || '-'}</TableCell>
                      <TableCell>{row[columnMapping.quantity] || '-'}</TableCell>
                      <TableCell>{row[columnMapping.price] || '-'}</TableCell>
                      <TableCell>{row[columnMapping.foil] || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {(state === 'enriching' || state === 'importing') && (
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            
            <div className="w-full max-w-md space-y-4">
              {state === 'enriching' ? (
                <>
                  <h3 className="text-xl font-semibold">Enriching card data from Scryfall...</h3>
                  <p className="text-gray-500">
                    {enrichmentProgress.current} / {enrichmentProgress.total} unique cards
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.max(5, (enrichmentProgress.current / (enrichmentProgress.total || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold">Importing cards...</h3>
                  <p className="text-gray-500">
                    {importProgress.current} / {importProgress.total} cards
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.max(5, (importProgress.current / (importProgress.total || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {state === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-medium text-sm">Successfully Imported</p>
                  <p className="text-2xl font-bold text-green-700">{results.success}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-medium text-sm">Stock Updated</p>
                  <p className="text-2xl font-bold text-blue-700">{results.updated}</p>
                </div>
                <RotateCcw className="h-8 w-8 text-blue-500 opacity-50" />
              </div>

              <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 p-4 rounded-lg flex items-center justify-between ${results.errors.length > 0 ? '' : 'opacity-50'}`}>
                <div>
                  <p className="text-red-600 font-medium text-sm">Errors</p>
                  <p className="text-2xl font-bold text-red-700">{results.errors.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="mt-6 border rounded-md">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b font-medium text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Error Details
                </div>
                <div className="max-h-60 overflow-y-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Row</TableHead>
                        <TableHead>Card Name</TableHead>
                        <TableHead>Error Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.errors.map((err, i) => (
                        <TableRow key={i}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell className="font-medium">{err.name || 'Unknown'}</TableCell>
                          <TableCell className="text-red-600">{err.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t p-6">
            <Button onClick={reset} className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" />
              Upload Another CSV
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
