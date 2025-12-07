'use client';

import { useState, useCallback } from 'react';
import { Frame, TopBar, Navigation } from '@shopify/polaris';
import { HomeIcon, OrderIcon, ProductIcon, PersonIcon, MegaphoneIcon, SettingsIcon, StoreIcon } from '@shopify/polaris-icons';
import { usePathname, useRouter } from 'next/navigation';

export function AppLayout({ children }) {
    const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
    const toggleMobileNavigationActive = useCallback(
        () => setMobileNavigationActive((mobileNavigationActive) => !mobileNavigationActive),
        [],
    );
    const pathname = usePathname();
    const router = useRouter();

    const userMenuMarkup = (
        <TopBar.UserMenu
            actions={[
                {
                    items: [{ content: 'Manage account' }, { content: 'Sign out' }],
                },
            ]}
            name="D E"
            detail="Rafi bhau"
            initials="DE"
            open={false}
            onToggle={() => { }}
        />
    );

    const topBarMarkup = (
        <TopBar
            showNavigationToggle
            userMenu={userMenuMarkup}
            onNavigationToggle={toggleMobileNavigationActive}
        />
    );

    const navigationMarkup = (
        <Navigation location={pathname}>
            <Navigation.Section
                items={[
                    {
                        url: '/',
                        label: 'Home',
                        icon: HomeIcon,
                        selected: pathname === '/',
                        onClick: () => router.push('/'),
                    },
                    {
                        url: '/orders',
                        label: 'Orders',
                        icon: OrderIcon,
                        selected: pathname.startsWith('/orders'),
                        onClick: () => router.push('/orders'),
                    },
                    {
                        url: '/products',
                        label: 'Products',
                        icon: ProductIcon,
                        selected: pathname.startsWith('/products'),
                        onClick: () => router.push('/products'),
                        subNavigationItems: [
                            {
                                url: '/products/add',
                                label: 'Add Product',
                                selected: pathname === '/products/add',
                                onClick: () => router.push('/products/add'),
                            },
                            {
                                url: '/products/categories',
                                label: 'Category',
                                selected: pathname === '/products/categories',
                                onClick: () => router.push('/products/categories'),
                            },
                            {
                                url: '/products/subcategories',
                                label: 'Sub Category',
                                selected: pathname === '/products/subcategories',
                                onClick: () => router.push('/products/subcategories'),
                            },
                            {
                                url: '/products/collections',
                                label: 'Collection',
                                selected: pathname === '/products/collections',
                                onClick: () => router.push('/products/collections'),
                            },
                        ],
                    },
                    {
                        url: '/customers',
                        label: 'Customers',
                        icon: PersonIcon,
                        selected: pathname.startsWith('/customers'),
                        onClick: () => router.push('/customers'),
                    },
                    {
                        url: '/marketing',
                        label: 'Marketing',
                        icon: MegaphoneIcon,
                        selected: pathname.startsWith('/marketing'),
                        onClick: () => router.push('/marketing'),
                    },
                ]}
            />
            <Navigation.Section
                title="Sales channels"
                items={[
                    {
                        url: '/online-store',
                        label: 'Online Store',
                        icon: StoreIcon,
                        selected: pathname.startsWith('/online-store'),
                        onClick: () => router.push('/online-store'),
                        subNavigationItems: [
                            {
                                url: '/online-store/pages',
                                label: 'Pages',
                                selected: pathname === '/online-store/pages',
                                onClick: () => router.push('/online-store/pages'),
                            },
                            {
                                url: '/online-store/navigation',
                                label: 'Navigation',
                                selected: pathname === '/online-store/navigation',
                                onClick: () => router.push('/online-store/navigation'),
                            },
                        ],
                    },
                ]}
            />
            <Navigation.Section
                items={[
                    {
                        url: '/settings',
                        label: 'Settings',
                        icon: SettingsIcon,
                        selected: pathname.startsWith('/settings'),
                        onClick: () => router.push('/settings'),
                    },
                ]}
            />
        </Navigation>
    );

    return (
        <Frame
            topBar={topBarMarkup}
            navigation={navigationMarkup}
            showMobileNavigation={mobileNavigationActive}
            onNavigationDismiss={toggleMobileNavigationActive}
        >
            {children}
        </Frame>
    );
}
