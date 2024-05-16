import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handledbError = (error) => {
        if (error.message.includes("multiple (or no) rows returned")) {
          setError("We can't seem to find your account. Try again, or don't I guess.");
        } else {
          setError("Something went wrong. It's probably our bad, so please try again later.");
        }
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        const { data, error: dbError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (dbError) {
            handledbError(dbError);
            return;
        }

        if (data) {
            const { user, error: loginError } = await supabase.auth.signInWithPassword({
                email: data.email, 
                password: password,
            });

            if (loginError) {
                setError(loginError.message);
            } else {
                console.log('Login successful:', user);
                navigate('/profile'); // Redirect to the profile page
            }
        } else {
            setError("User not found");
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl text-center">Login to Your Account</h1>
            {error && <p className="text-stone-500 text-sm font-bold text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <p className="text-xs text-left text-slate-500">
                        <Link to="/forgot-password" className="hover:underline">Forgot me?</Link>
                    </p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-stone-400 hover:bg-stone-500 text-black py-2 px-4 rounded transition-colors duration-300">
                    Login
                </button>
            </form>
            <p className="text-center">
                No account? <Link to="/signup" className="text-blue-500 font-italics hover:transition-all">Create one</Link>
            </p>
        </div>
    );
};

export default LoginPage;
