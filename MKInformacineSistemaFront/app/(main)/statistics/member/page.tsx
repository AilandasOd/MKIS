'use client';
import { ChartData, ChartOptions } from 'chart.js';
import { Chart } from 'primereact/chart';
import { ProgressBar } from 'primereact/progressbar';
import React, { useContext, useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import type { ChartDataState, ChartOptionsState } from '@/types';

const HunterStatistics = () => {
    const [options, setOptions] = useState<ChartOptionsState>({});
    const [data, setChartData] = useState<ChartDataState>({});
    const { layoutConfig } = useContext(LayoutContext);

    const huntedAnimalsList = [
        { name: 'Briedžiai', hunted: 0 },
        { name: 'Taurieji elniai', hunted: 25 },
        { name: 'Danieliai', hunted: 0 },
        { name: 'Stirnos', hunted: 0 },
        { name: 'Šernai', hunted: 18 },
        { name: 'Vilkai', hunted: 0 },
        { name: 'Paprastieji šakalai', hunted: 0 },
        { name: 'Miškinės kiaunės', hunted: 0 },
        { name: 'Akmeninės kiaunės', hunted: 0 },
        { name: 'Juodieji šeškai', hunted: 0 },
        { name: 'Barsukai', hunted: 0 },
        { name: 'Pilkieji kiškiai', hunted: 12 },
        { name: 'Bebrai', hunted: 0 },
        { name: 'Želmeninės žąsys', hunted: 0 },
        { name: 'Baltakaktės žąsys', hunted: 0 },
        { name: 'Didžiosios antys', hunted: 0 },
        { name: 'Rudagalvės kryklės', hunted: 0 },
        { name: 'Klykuolės', hunted: 0 },
        { name: 'Kanadinės berniklės', hunted: 0 },
        { name: 'Kuoduotosios antys', hunted: 0 },
        { name: 'Laukiai', hunted: 0 },
        { name: 'Perkūno oželiai', hunted: 0 },
        { name: 'Slankos', hunted: 0 },
        { name: 'Fazanai', hunted: 0 },
        { name: 'Keršuliai', hunted: 0 },
        { name: 'Uoliniai karveliai', hunted: 0 },
        { name: 'Kovai', hunted: 0 },
        { name: 'Pilkosios varnos', hunted: 0 },
        { name: 'Lapės', hunted: 10 },
        { name: 'Mangutai', hunted: 0 },
        { name: 'Paprastieji meškėnai', hunted: 0 },
        { name: 'Kanadinės audinės', hunted: 0 },
        { name: 'Nutrijos', hunted: 0 },
        { name: 'Ondatros', hunted: 0 },
        { name: 'Dėmėtieji elniai', hunted: 0 },
        { name: 'Dovydo elniai', hunted: 0 }
    ];


    useEffect(() => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dfe7ef';

        const animalsHunted = {
            Elnias: 25,
            Šernas: 18,
            Lapė: 10,
            'Pilkieji kiškiai': 12,
            Vilkas: 5,
            Mangutas: 3
        };

        const totalShots = 200;
        const totalHits = 140;
        const drivenHunts = 15;
        const huntingDays = 45;
        const longestShot = 320;

        const barData: ChartData = {
            labels: Object.keys(animalsHunted),
            datasets: [{
                label: 'Sumedžioti žvėrys',
                backgroundColor: documentStyle.getPropertyValue('--primary-500') || '#6366f1',
                borderColor: documentStyle.getPropertyValue('--primary-500') || '#6366f1',
                data: Object.values(animalsHunted)
            }]
        };

        const pieData: ChartData = {
            labels: Object.keys(animalsHunted),
            datasets: [{
                data: Object.values(animalsHunted),
                backgroundColor: [
                    documentStyle.getPropertyValue('--indigo-500') || '#6366f1',
                    documentStyle.getPropertyValue('--purple-500') || '#a855f7',
                    documentStyle.getPropertyValue('--teal-500') || '#14b8a6',
                    documentStyle.getPropertyValue('--orange-500') || '#f97316',
                    documentStyle.getPropertyValue('--cyan-500') || '#06b6d4'
                ],
                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--indigo-400') || '#8183f4',
                    documentStyle.getPropertyValue('--purple-400') || '#b975f9',
                    documentStyle.getPropertyValue('--teal-400') || '#41c5b7',
                    documentStyle.getPropertyValue('--orange-400') || '#fb923c',
                    documentStyle.getPropertyValue('--cyan-400') || '#22d3ee'
                ]
            }]
        };

        const lineData: ChartData = {
            labels: ['Shots Taken', 'Hits', 'Misses'],
            datasets: [{
                label: 'Shot Accuracy',
                data: [totalShots, totalHits, totalShots - totalHits],
                fill: false,
                backgroundColor: documentStyle.getPropertyValue('--primary-500') || '#6366f1',
                borderColor: documentStyle.getPropertyValue('--primary-500') || '#6366f1',
                tension: 0.4
            }]
        };

        const polarData: ChartData = {
            labels: ['Driven Hunts', 'Hunting Days', 'Longest Shot (m)'],
            datasets: [{
                data: [drivenHunts, huntingDays, longestShot / 10],
                backgroundColor: [
                    documentStyle.getPropertyValue('--indigo-500') || '#6366f1',
                    documentStyle.getPropertyValue('--teal-500') || '#14b8a6',
                    documentStyle.getPropertyValue('--orange-500') || '#f97316'
                ]
            }]
        };

        const radarData: ChartData = {
            labels: ['Accuracy (%)', 'Miss Ratio (%)', 'Driven Hunts', 'Total Animals', 'Longest Shot (100m)'],
            datasets: [{
                label: 'Performance Overview',
                data: [
                    (totalHits / totalShots) * 100,
                    ((totalShots - totalHits) / totalShots) * 100,
                    drivenHunts,
                    Object.values(animalsHunted).reduce((a, b) => a + b, 0),
                    longestShot / 100
                ],
                borderColor: documentStyle.getPropertyValue('--purple-400') || '#b975f9',
                pointBackgroundColor: documentStyle.getPropertyValue('--purple-400') || '#b975f9',
                pointBorderColor: documentStyle.getPropertyValue('--purple-400') || '#b975f9',
                pointHoverBackgroundColor: textColor,
                pointHoverBorderColor: documentStyle.getPropertyValue('--purple-400') || '#b975f9'
            }]
        };

        setOptions({
            barOptions: { plugins: { legend: { labels: { color: textColor } } }, scales: { x: { ticks: { color: textColorSecondary, font: { weight: '500' } }, grid: { display: false }, border: { display: false } }, y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder }, border: { display: false } } }, maintainAspectRatio: false },
            pieOptions: { plugins: { legend: { labels: { usePointStyle: true, color: textColor } } }, maintainAspectRatio: false },
            lineOptions: { plugins: { legend: { labels: { color: textColor } } }, scales: { x: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder }, border: { display: false } }, y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder }, border: { display: false } } }, maintainAspectRatio: false },
            polarOptions: { plugins: { legend: { labels: { color: textColor } } }, scales: { r: { grid: { color: surfaceBorder } } }, maintainAspectRatio: false },
            radarOptions: { plugins: { legend: { labels: { color: textColor } } }, scales: { r: { grid: { color: textColorSecondary } } }, maintainAspectRatio: false }
        });

        setChartData({ barData, pieData, lineData, polarData, radarData });
    }, [layoutConfig]);

    const hitPercentage = parseFloat(((140 / 200) * 100).toFixed(2));
    const drivenHuntsPercentage = parseFloat(((15 / 45) * 100).toFixed(2));

    return (
        <div className="grid p-fluid">
            <div className="col-12">
                <div className="card">
                    <h5>Šūvių taiklumas</h5>
                    <div className="relative">
                        <ProgressBar value={hitPercentage} showValue></ProgressBar>
                        <div className="text-center font-bold mt-2">140 / 200 Šūvių</div>
                    </div>
                </div>
            </div>
            <div className="col-12">
                <div className="card">
                    <h5>Varyminių medžioklių atkyvumas</h5>
                    <div className="relative">
                        <ProgressBar value={drivenHuntsPercentage} showValue></ProgressBar>
                        <div className="text-center font-bold mt-2">15 / 45 Medžioklių</div>
                    </div>
                </div>
            </div>
            <div className="col-12 xl:col-6">
                <div className="card flex flex-column align-items-center" style={{ height: '400px' }}>
                    <h5 className="text-left w-full">Sumedžioti žvėrys</h5>
                    <Chart type="bar" data={data.barData} options={options.barOptions} style={{ width: '100%', height: '300px' }}></Chart>
                </div>
            </div>
            <div className="col-12 xl:col-6">
                <div className="card flex flex-column align-items-center" style={{ height: '400px' }}>
                    <h5 className="text-left w-full">Sumedžioti žvėrys pagal rūšį</h5>
                    <Chart type="pie" data={data.pieData} options={options.pieOptions} style={{ width: '100%', height: '300px' }}></Chart>
                </div>
            </div>
            <div className="col-12">
                <div className="card">
                    <h5>Sumedžiotų žvėrių sąrašas</h5>
                    <DataTable value={huntedAnimalsList} stripedRows showGridlines>
                        <Column field="name" header="Žvėris"></Column>
                        <Column field="hunted" header="Sumedžiota"></Column>
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default HunterStatistics;
