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
        console.log("Signing up with:", email, username, password);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                console.error("Signup error:", signUpError.message);
                setError("Signup error: " + signUpError.message);
                return;
            }

            console.log("SIGNUP RESPONSE:", JSON.stringify(data, null, 2));

            // If user data is available, proceed to insert the additional details into your custom `profiles` table
            if (data && data.user) {
                const userId = data.user.id;
                console.log("User ID:", userId);

                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([
                        { user_id: userId, username: username, email: email }
                    ]);

                if (insertError) {
                    console.error("Database insertion error:", insertError.message);
                    setError("Database insertion error: " + insertError.message);
                } else {
                    console.log('Signup and profile creation successful:', data.user);
                    navigate('/profile'); // Navigate to user profile or dashboard
                }
            } else {
                setError("No user data available after signup.");
                console.error("No user data available after signup.");
            }
        } catch (err) {
            console.error("Unexpected error during signup:", err);
            setError("Unexpected error occurred");
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl text-center">Create an Account</h1>
            {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
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
                <button type="submit" className="w-full bg-stone-500 hover:bg-neutral-400 text-white py-2 px-4 rounded transition-colors duration-300">
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
