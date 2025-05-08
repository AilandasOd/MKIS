'use client';

import { useEffect } from 'react';
import { addLocale, locale } from 'primereact/api';

const PrimeReactLocaleProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    addLocale('lt', {
      firstDayOfWeek: 1,
      dayNames: ['Sekmadienis', 'Pirmadienis', 'Antradienis', 'Trečiadienis', 'Ketvirtadienis', 'Penktadienis', 'Šeštadienis'],
      dayNamesShort: ['Sk', 'Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št'],
      dayNamesMin: ['Sk', 'Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št'],
      monthNames: ['Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė', 'Birželis', 'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'],
      monthNamesShort: ['Sau', 'Vas', 'Kov', 'Bal', 'Geg', 'Bir', 'Lie', 'Rgp', 'Rgs', 'Spa', 'Lap', 'Grd'],
      today: 'Šiandien',
      clear: 'Išvalyti'
    });

    locale('lt');
  }, []);

  return <>{children}</>;
};

export default PrimeReactLocaleProvider;
