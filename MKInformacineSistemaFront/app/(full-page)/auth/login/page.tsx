// Update the login page to handle Lithuanian error messages
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState, useRef } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useAuth } from '../../../../context/AuthContext';
import { Toast } from 'primereact/toast';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const { login } = useAuth();
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    const handleLogin = async () => {
        try {
            const res = await fetch('https://localhost:7091/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // important for cookies
                body: JSON.stringify({
                    userName: username,
                    password: password
                })
            });

            if (res.ok) {
                // Parse access token
                const data = await res.json();
                // Use the auth context to handle login
                login(data.accessToken);
                
                // Navigation is handled by the auth context
            } else {
                // Show Lithuanian error message for login failures
                toast.current?.show({ 
                    severity: 'error', 
                    summary: 'Klaida', 
                    detail: 'Įvestas neteisingas slapyvardis arba slaptažodis', 
                    life: 3000 
                });
            }
        } catch (err) {
            console.error('Login error:', err);
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Klaida', 
                detail: 'Įvyko klaida bandant prisijungti. Bandykite dar kartą.', 
                life: 3000 
            });
        }
    };

    return (
        <div className={containerClassName}>
            <Toast ref={toast} />
            <div className="flex flex-column align-items-center justify-content-center">
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                        <img src={`/layout/images/MKIS_logo.png`} alt="logo" height="50" />
                            <div className="text-900 text-3xl font-medium mb-3">Sveiki!</div>
                            <span className="text-600 font-medium">Prisijunkite, kad galėtumėte tęsti.</span>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-900 text-xl font-medium mb-2">
                                Slapyvardis
                            </label>
                            <InputText
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                type="text"
                                placeholder="Slapyvardis"
                                className="w-full md:w-30rem mb-5"
                                style={{ padding: '1rem' }}
                            />

                            <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                Slaptažodis
                            </label>
                            <Password
                                inputId="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Slaptažodis"
                                toggleMask
                                feedback={false}
                                className="w-full mb-5"
                                inputClassName="w-full p-3 md:w-30rem"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleLogin();
                                    }
                                }}
                            ></Password>

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <Checkbox inputId="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked ?? false)} className="mr-2"></Checkbox>
                                    <label htmlFor="rememberme1">Prisiminti mane</label>
                                </div>
                                <a className="font-medium no-underline ml-2 text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                    Pamiršote slaptažodį?
                                </a>
                            </div>
                            <Button label="Prisijungti" className="w-full p-3 text-xl" onClick={handleLogin}></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;