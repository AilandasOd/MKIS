import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { useClub } from '../context/ClubContext';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { selectedClub, isUserAdminInSelectedClub } = useClub();

    const clubId = selectedClub?.id || '';

    const model: AppMenuItem[] = [
        {
            label: 'Meniu',
            items: [
                { label: 'Pradžia', icon: 'pi pi-fw pi-home', to: '/dashboard' },
                { label: 'Klubas', icon: 'pi pi-fw pi-building', to: `/clubs/${clubId}` },
                {
                    label: 'Žemėlapiai',
                    icon: 'pi pi-fw pi-map',
                    items: [
                        {
                            label: 'Medžioklės plotų žemėlapis',
                            icon: 'pi pi-fw pi-image',
                            to: '/uikit/mapsList'
                        },
                        {
                            label: 'Medžioklės plotų žymėjimas',
                            icon: 'pi pi-fw pi-map-marker',
                            to: '/uikit/mapsCreate'
                        },
                        {
                            label: 'Medžioklės objektų žymėjimas',
                            icon: 'pi pi-fw pi-box',
                            to: '/maps/objectsmap'
                        },
                    ]
                },
                { label: 'Nariai', icon: 'pi pi-fw pi-users', to: '/members' },
                { label: 'Tyrimai', icon: 'pi pi-fw pi-book', to: '/tests/list' },
                { label: 'Varyminės medžioklės', icon: 'pi pi-fw pi-list', to: '/drivenhunts/list' },
                { label: 'Statistika', icon: 'pi pi-fw pi-chart-bar', items: [
                    { label: 'Mano statistika', icon: 'pi pi-fw pi-chart-pie', to: '/statistics/member' },
                    { label: 'Klubo statistika', icon: 'pi pi-fw pi-chart-pie', to: '/statistics/club' },
                ] },
            ]
        },
        // Only include the Administration section if user has Admin or Owner role in the selected club
        ...(isUserAdminInSelectedClub() ? [
            {
                label: 'Administravimas',
                items: [
                    { label: 'Klubo nariai', icon: 'pi pi-fw pi-users', to: '/admin/members' },
                    { label: 'Medžioklės plotų ribos žymėjimas', icon: 'pi pi-fw pi-share-alt', to: '/admin/areamap' },
                    { label: 'Medžioklės objektų redagavimas', icon: 'pi pi-box', to: '/admin/mapobjects' },
                    { label: 'Klubo įrašų valdymas', icon: 'pi pi-comment', to: '/admin/posts' },
                ]
            }
        ] : [])
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;