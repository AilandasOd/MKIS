// MKInformacineSistemaFront/layout/AppTopbar.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { AppTopbarRef } from '../types/types';
import { LayoutContext } from './context/layoutcontext';
import { Button } from 'primereact/button';
import { useAuth } from '../context/AuthContext';
import { useClub } from '../context/ClubContext';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const { isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const { clubs, selectedClub, setSelectedClub } = useClub();
    const [mounted, setMounted] = useState(false);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    // Important: This prevents hydration issues
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
    };

    // State for custom dropdown
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Custom club selector that doesn't rely on PrimeReact Dropdown
    const renderClubSelector = () => {
        if (!mounted || clubs.length === 0) return null;

        return (
            <div className="custom-club-selector mr-3">
                <style jsx>{`
                    .custom-club-selector {
                        position: relative;
                        min-width: 200px;
                        height: 36px;
                    }
                    .selector-display {
                        display: flex;
                        align-items: center;
                        padding: 0 10px;
                        height: 100%;
                        border-radius: 4px;
                        cursor: pointer;
                        background-color: var(--surface-overlay);
                        border: 1px solid var(--surface-border);
                    }
                    .club-logo {
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        margin-right: 8px;
                        object-fit: cover;
                    }
                    .club-icon {
                        margin-right: 8px;
                    }
                    .dropdown-items {
                        position: absolute;
                        top: calc(100% + 5px);
                        left: 0;
                        width: 100%;
                        background-color: var(--surface-overlay);
                        border-radius: 4px;
                        border: 1px solid var(--surface-border);
                        z-index: 1000;
                        max-height: 300px;
                        overflow-y: auto;
                    }
                    .dropdown-item {
                        display: flex;
                        align-items: center;
                        padding: 8px 10px;
                        cursor: pointer;
                    }
                    .dropdown-item:hover {
                        background-color: var(--surface-hover);
                    }
                    .arrow-icon {
                        margin-left: auto;
                    }
                `}</style>
                
                <div 
                    className="selector-display"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                    {selectedClub?.logoUrl ? (
                        <img 
                            src={`https://localhost:7091${selectedClub.logoUrl}`} 
                            alt={selectedClub.name} 
                            className="club-logo" 
                        />
                    ) : (
                        <i className="pi pi-users club-icon"></i>
                    )}
                    <span>{selectedClub?.name || "Select a Club"}</span>
                    <i className="pi pi-chevron-down arrow-icon"></i>
                </div>
                
                {dropdownOpen && (
                    <div className="dropdown-items">
                        {clubs.map(club => (
                            <div 
                                key={club.id}
                                className="dropdown-item"
                                onClick={() => {
                                    setSelectedClub(club);
                                    setDropdownOpen(false);
                                }}
                            >
                                {club.logoUrl ? (
                                    <img 
                                        src={`https://localhost:7091${club.logoUrl}`} 
                                        alt={club.name} 
                                        className="club-logo" 
                                    />
                                ) : (
                                    <i className="pi pi-users club-icon"></i>
                                )}
                                <span>{club.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <img src={`/layout/images/MKIS_logo.png`} alt="logo" />
                <span>Medžioklės klubų IS</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                {/* Custom Club Selector */}
                {mounted && isAuthenticated && renderClubSelector()}
                
                {/* Create Club Button */}
                {mounted && isAuthenticated && (
                    <Button 
                        icon="pi pi-plus" 
                        className="p-button-rounded p-button-outlined p-button-sm mr-2" 
                        onClick={() => router.push('/clubs/create')} 
                        tooltip="Sukruti naują klubą" 
                        tooltipOptions={{ position: 'bottom' }} 
                    />
                )}

                {/* Profile Button - RESTORED */}
                <Link href="/profile" className="p-link layout-topbar-button">
                    <i className="pi pi-user"></i>
                    <span>Profile</span>
                </Link>

                {mounted && isAuthenticated ? (
                    <button type="button" className="p-link layout-topbar-button" onClick={handleLogout}>
                        <i className="pi pi-sign-out"></i>
                        <span>Logout</span>
                    </button>
                ) : (
                    <Link href="/auth/login" className="p-link layout-topbar-button">
                        <i className="pi pi-sign-in"></i>
                        <span>Login</span>
                    </Link>
                )}
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;