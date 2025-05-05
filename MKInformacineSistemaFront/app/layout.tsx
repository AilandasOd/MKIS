// MKInformacineSistemaFront/app/layout.tsx
'use client';
import { LayoutProvider } from '../layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
import { AuthProvider } from '../context/AuthContext';
import { ClubProvider } from '../context/ClubContext';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/demo/Demos.scss';

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link id="theme-css" href={`/themes/lara-dark-green/theme.css`} rel="stylesheet"></link>
            </head>
            <body>
                <PrimeReactProvider>
                    <AuthProvider>
                        <ClubProvider>
                            <LayoutProvider>{children}</LayoutProvider>
                        </ClubProvider>
                    </AuthProvider>
                </PrimeReactProvider>
            </body>
        </html>
    );
}