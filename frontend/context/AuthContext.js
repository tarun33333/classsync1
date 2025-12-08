import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = async (email, password, macAddress) => {
        setIsLoading(true);
        try {
            const res = await client.post('/auth/login', { email, password, macAddress });
            const { token, role, ...user } = res.data;

            setUserToken(token);
            setUserRole(role);
            setUserInfo(user);

            await SecureStore.setItemAsync('userToken', token);
            await SecureStore.setItemAsync('userRole', role);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
        } catch (e) {
            console.log(e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserRole(null);
        setUserInfo(null);
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userRole');
        await SecureStore.deleteItemAsync('userInfo');
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let userToken = await SecureStore.getItemAsync('userToken');
            let userRole = await SecureStore.getItemAsync('userRole');
            let userInfo = await SecureStore.getItemAsync('userInfo');

            if (userToken) {
                try {
                    // VERIFY TOKEN WITH BACKEND
                    // We need to manually set header here because 'client' interceptor 
                    // might not have picked up the token from store yet if we just set it.
                    // Actually interceptor reads from Store, so it should be fine? 
                    // Let's be safe and set it or rely on interceptor.
                    // Interceptor reads 'userToken' from SecureStore.

                    const res = await client.get('/auth/verify');

                    // Token is valid, update state with fresh user data
                    setUserToken(userToken);
                    setUserRole(res.data.role);
                    setUserInfo(res.data);

                    // Update stored info
                    await SecureStore.setItemAsync('userInfo', JSON.stringify(res.data));
                    await SecureStore.setItemAsync('userRole', res.data.role);

                } catch (apiError) {
                    console.log('Token verification failed:', apiError);
                    // Token invalid or user deleted -> Logout
                    await logout();
                }
            }
            setIsLoading(false);
        } catch (e) {
            console.log(`isLoggedIn error ${e}`);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, userRole, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
