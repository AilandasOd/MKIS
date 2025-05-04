/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import { LayoutContext } from './context/layoutcontext';

const AppFooter = () => {
    const { layoutConfig } = useContext(LayoutContext);

    return (
        <div className="layout-footer">
            <img src={`/layout/images/MKIS_logo.png`} alt="Logo" height="20" className="mr-2" />
            <span className="font-medium ml-2">MEDŽIOKLĖS KLUBŲ INFORMACINĖ SISTEMA</span>
        </div>
    );
};

export default AppFooter;
