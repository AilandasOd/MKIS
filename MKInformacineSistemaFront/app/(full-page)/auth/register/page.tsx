'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { classNames } from 'primereact/utils';
import { addLocale, locale } from 'primereact/api';

addLocale('lt', {
    firstDayOfWeek: 1,
    dayNames: ['sekmadienis', 'pirmadienis', 'antradienis', 'trečiadienis', 'ketvirtadienis', 'penktadienis', 'šeštadienis'],
    dayNamesShort: ['Sk', 'Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št'],
    dayNamesMin: ['S', 'P', 'A', 'T', 'K', 'Pn', 'Š'],
    monthNames: ['sausis', 'vasaris', 'kovas', 'balandis', 'gegužė', 'birželis', 'liepa', 'rugpjūtis', 'rugsėjis', 'spalis', 'lapkritis', 'gruodis'],
    monthNamesShort: ['Sau', 'Vas', 'Kov', 'Bal', 'Geg', 'Bir', 'Lie', 'Rgp', 'Rgs', 'Spa', 'Lap', 'Grd'],
    today: 'Šiandien',
    clear: 'Išvalyti'
});

locale('lt');

const RegisterPage = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [formData, setFormData] = useState({
        userName: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: null as Date | null,
        huntingTicketIssueDate: null as Date | null
    });

    const [submitted, setSubmitted] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        setFormData({
            ...formData,
            [field]: e.target.value
        });
    };

    const handleDateChange = (date: Date | null, field: string) => {
        setFormData({
            ...formData,
            [field]: date
        });
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        if (!formData.userName || 
            !formData.email || 
            !formData.password || 
            !formData.confirmPassword ||
            !formData.firstName ||
            !formData.lastName ||
            !formData.dateOfBirth ||
            !formData.huntingTicketIssueDate) {
            toast.current?.show({ severity: 'error', summary: 'Klaida', detail: 'Visi laukai yra privalomi', life: 3000 });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.current?.show({ severity: 'error', summary: 'Klaida', detail: 'Slaptažodžiai nesutampa', life: 3000 });
            return;
        }

        try {
            const response = await fetch('https://localhost:7091/api/accounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userName: formData.userName,
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber: formData.phoneNumber,
                    dateOfBirth: formData.dateOfBirth,
                    huntingTicketIssueDate: formData.huntingTicketIssueDate
                })
            });

            if (response.ok) {
                toast.current?.show({ severity: 'success', summary: 'Registracija sėkminga', detail: 'Jūsų paskyra sukurta', life: 3000 });
                setTimeout(() => {
                    router.push('/auth/login');
                }, 2000);
            } else {
                const errorText = await response.text();
                toast.current?.show({ severity: 'error', summary: 'Klaida', detail: errorText || 'Registracija nepavyko', life: 3000 });
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.current?.show({ severity: 'error', summary: 'Klaida', detail: 'Nepavyko prisijungti prie serverio', life: 3000 });
        }
    };

    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    return (
        <div className={containerClassName}>
            <Toast ref={toast} />
            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`/layout/images/MKIS_logo.png`} alt="Logo" height="100" className="mb-5" />
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <Card className="w-full p-4" style={{ borderRadius: '53px', maxWidth: '650px' }}>
                        <h2 className="text-center text-2xl font-semibold mb-4">Sukurti paskyrą</h2>
                        <p className="text-center text-gray-600 mb-5">
                            Prisijunkite prie Medžiotojų Klubo informacinės sistemos
                        </p>

                        <div className="grid formgrid">
                            <div className="field col-12 md:col-6">
                                <label htmlFor="userName" className="block text-sm font-medium mb-2">Naudotojo vardas*</label>
                                <InputText
                                    id="userName"
                                    value={formData.userName}
                                    onChange={(e) => handleInputChange(e, 'userName')}
                                    className={classNames({ 'p-invalid': submitted && !formData.userName }, 'w-full')}
                                />
                                {submitted && !formData.userName && <small className="p-error">Privalomas laukelis</small>}
                            </div>

                            <div className="field col-12 md:col-6">
                                <label htmlFor="email" className="block text-sm font-medium mb-2">El. paštas*</label>
                                <InputText
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange(e, 'email')}
                                    className={classNames({ 'p-invalid': submitted && !formData.email }, 'w-full')}
                                />
                                {submitted && !formData.email && <small className="p-error">Privalomas laukelis</small>}
                            </div>

                            <div className="field col-12 md:col-6">
                                <label htmlFor="firstName" className="block text-sm font-medium mb-2">Vardas*</label>
                                <InputText
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange(e, 'firstName')}
                                    className={classNames({ 'p-invalid': submitted && !formData.firstName }, 'w-full')}
                                />
                                {submitted && !formData.firstName && <small className="p-error">Privalomas laukelis</small>}
                            </div>

                            <div className="field col-12 md:col-6">
                                <label htmlFor="lastName" className="block text-sm font-medium mb-2">Pavardė*</label>
                                <InputText
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange(e, 'lastName')}
                                    className={classNames({ 'p-invalid': submitted && !formData.lastName }, 'w-full')}
                                />
                                {submitted && !formData.lastName && <small className="p-error">Privalomas laukelis</small>}
                            </div>

                            <div className="field col-12 md:col-6">
                                <label htmlFor="phoneNumber" className="block text-sm font-medium mb-2">Telefono numeris</label>
                                <InputText
                                    id="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={(e) => handleInputChange(e, 'phoneNumber')}
                                    className="w-full"
                                />
                            </div>

                            <div className="field col-12 md:col-6">
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-2">Gimimo data*</label>
                                <Calendar
                                    id="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => handleDateChange(e.value as Date, 'dateOfBirth')}
                                    showIcon
                                    className={classNames({ 'p-invalid': submitted && !formData.dateOfBirth }, 'w-full')}
                                />
                                {submitted && !formData.dateOfBirth && <small className="p-error">Privalomas laukelis</small>}
                            </div>

                            <div className="field col-12">
                                <label htmlFor="huntingTicketIssueDate" className="block text-sm font-medium mb-2">Medžiotojo bilieto išdavimo data*</label>
                                <Calendar
                                    id="huntingTicketIssueDate"
                                    value={formData.huntingTicketIssueDate}
                                    onChange={(e) => handleDateChange(e.value as Date, 'huntingTicketIssueDate')}
                                    showIcon
                                    className={classNames({ 'p-invalid': submitted && !formData.huntingTicketIssueDate }, 'w-full')}
                                />
                                {submitted && !formData.huntingTicketIssueDate && <small className="p-error">Privalomas laukelis</small>}
                            </div>

                            <div className="field col-12 md:col-6">
                                <label htmlFor="password" className="block text-sm font-medium mb-2">Slaptažodis*</label>
                                <Password
                                    id="password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange(e, 'password')}
                                    toggleMask
                                    feedback={false}
                                    className={classNames({ 'p-invalid': submitted && !formData.password }, 'w-full')}
                                />
                                {submitted && !formData.password && <small className="p-error">Privalomas laukelis</small>}
                            </div>

                            <div className="field col-12 md:col-6">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Patvirtinti slaptažodį*</label>
                                <Password
                                    id="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange(e, 'confirmPassword')}
                                    toggleMask
                                    feedback={false}
                                    className={classNames({ 'p-invalid': submitted && (!formData.confirmPassword || formData.password !== formData.confirmPassword) }, 'w-full')}
                                />
                                {submitted && !formData.confirmPassword && <small className="p-error">Privalomas laukelis</small>}
                                {submitted && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <small className="p-error">Slaptažodžiai nesutampa</small>
                                )}
                            </div>

                            <div className="col-12 mt-4">
                                <Button label="Registruotis" icon="pi pi-user-plus" onClick={handleSubmit} className="w-full" />
                            </div>

                            <div className="col-12 mt-4 text-center">
                                <p>
                                    Jau turite paskyrą?{' '}
                                    <span
                                        className="font-medium cursor-pointer text-primary"
                                        onClick={() => router.push('/auth/login')}
                                    >
                                        Prisijungti
                                    </span>
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
