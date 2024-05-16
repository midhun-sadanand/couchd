import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const SignupPage = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // First, sign up the user with Supabase Auth
        const { data: user, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
        } else {
            // Get the user's UID from the signed-up user
            const userId = user.user.id();

            // Then, insert the additional details into your custom `profiles` table
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([
                    { id: userId, username: username, email: email }
                ]);

            if (insertError) {
                setError(insertError.message);
            } else {
                console.log('Signup successful:', user);
                navigate('/user/' + username);
            }
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl text-center">Create an Account</h1>
            {error && <p className="text-stone-500 text-sm font-bold text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                    />
                </div>
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
                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-stone-500 hover:bg-neutral-400 text-black py-2 px-4 rounded transition-colors duration-300">
                    Sign Up
                </button>
            </form>
            <p className="text-center text-gray-500 mt-4">
                Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
            </p>
        </div>
    );
};

export default SignupPage;
