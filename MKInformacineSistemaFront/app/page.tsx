'use client';
/* eslint-disable @next/next/no-img-element */
import React, { useContext, useRef, useState } from 'react';
import Link from 'next/link';

import { StyleClass } from 'primereact/styleclass';
import { Button } from 'primereact/button';
import { Ripple } from 'primereact/ripple';
import { Divider } from 'primereact/divider';
import { LayoutContext } from '../layout/context/layoutcontext';
import { NodeRef } from '@/types';
import { classNames } from 'primereact/utils';

const LandingPage = () => {
    const [isHidden, setIsHidden] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const menuRef = useRef<HTMLElement | null>(null);

    const toggleMenuItemClick = () => {
        setIsHidden((prevState) => !prevState);
    };

    return (
        <div className="surface-0 flex justify-content-center">
            <div id="home" className="landing-wrapper overflow-hidden">
                <div className="py-4 px-4 mx-0 md:mx-6 lg:mx-8 lg:px-8 flex align-items-center justify-content-between relative lg:static">
                    <Link href="/" className="flex align-items-center">
                        <img src={`/layout/images/MKIS_logo.png`} alt="logo" height="50" />
                    </Link>
                    <StyleClass nodeRef={menuRef as NodeRef} selector="@next" enterClassName="hidden" leaveToClassName="hidden" hideOnOutsideClick>
                        <i ref={menuRef} className="pi pi-bars text-4xl cursor-pointer block lg:hidden text-700"></i>
                    </StyleClass>
                    <div className={classNames('align-items-center surface-0 flex-grow-1 justify-content-between hidden lg:flex absolute lg:static w-full left-0 px-6 lg:px-0 z-2', { hidden: isHidden })} style={{ top: '100%' }}>
                       
                        <div className="flex justify-content-between lg:block border-top-1 lg:border-top-none surface-border py-3 lg:py-0 mt-3 lg:mt-0">
                            <Link href="/auth/login" passHref>
                                <Button label="Prisijungti" text rounded className="border-none font-light line-height-2 text-green-500" />
                            </Link>
                            <Link href="/auth/register" passHref>
                                <Button label="Registruotis" rounded className="border-none ml-5 font-light line-height-2 bg-green-500 text-white"></Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="py-4 px-4 mx-0 md:mx-6 lg:mx-8 lg:px-8 mt-5">
                    <div className="grid grid-nogutter justify-content-center">
                        <div className="col-12 md:col-10 text-center mt-6">
                            <h1 className="text-6xl font-bold text-gray-300 line-height-2">
                                Medžioklės Klubų Informacinė Sistema
                            </h1>
                           
                            <div className="mt-6 text-center">
                                <Link href="/auth/register" passHref>
                                    <Button label="Registruokites" className="font-bold px-5 py-3 mr-3 bg-green-500 hover:bg-green-400 border-none" />
                                </Link>
                                <Link href="/auth/login" passHref>
                                    <Button label="Prisijungti" className="font-bold px-5 py-3 border-1 border-green-500 text-green-500 hover:bg-green-500 hover:text-white" outlined />
                                </Link>
                            </div>
                        </div>
                        
                    </div>
                </div>
                
                <div className="py-4 px-4 mx-0 md:mx-6 lg:mx-8 lg:px-8">
                    <div className="grid justify-content-center">
                        <div className="col-12 text-center mt-4 mb-4">
                            <h2 className="text-900 font-normal mb-2">Pagrindinės sistemos funkcijos</h2>
                            <span className="text-600 text-2xl">Viską, ko reikia šiuolaikiniams medžiotojų klubams</span>
                        </div>
                        
                        <div className="col-12 md:col-4 mb-4 px-3">
                            <div className="p-3 h-full">
                                <div className="shadow-2 p-4 h-full surface-card border-round">
                                    <div className="text-center text-green-500 mb-3">
                                        <i className="pi pi-map text-4xl"></i>
                                    </div>
                                    <h3 className="text-xl font-medium text-900 text-center">Medžioklės plotų valdymas</h3>
                                    <p className="text-center">Pažymėkite medžioklės plotus interaktyviame žemėlapyje ir efektyviai planuokite medžiokles</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-12 md:col-4 mb-4 px-3">
                            <div className="p-3 h-full">
                                <div className="shadow-2 p-4 h-full surface-card border-round">
                                    <div className="text-center text-green-500 mb-3">
                                        <i className="pi pi-users text-4xl"></i>
                                    </div>
                                    <h3 className="text-xl font-medium text-900 text-center">Narių valdymas</h3>
                                    <p className="text-center">Valdykite klubo narius, sekite jų statistiką ir aktyvumą medžioklėse</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-12 md:col-4 mb-4 px-3">
                            <div className="p-3 h-full">
                                <div className="shadow-2 p-4 h-full surface-card border-round">
                                    <div className="text-center text-green-500 mb-3">
                                        <i className="pi pi-chart-bar text-4xl"></i>
                                    </div>
                                    <h3 className="text-xl font-medium text-900 text-center">Tyrimų rezultati</h3>
                                    <p className="text-center">Valdykite sumedžiotų žvėrių kraujo tyrimus</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;