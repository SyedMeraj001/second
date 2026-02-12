import { useState, useEffect } from 'react';

const ProfileSettings = ({ user, onUpdate }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        bio: '',
        job_title: '',
        phone_number: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setFormData({
                    full_name: data.full_name || '',
                    email: data.email || '',
                    bio: data.bio || '',
                    job_title: data.job_title || '',
                    phone_number: data.phone_number || ''
                });
                if (data.profile_picture) {
                    setPreviewImage(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${data.profile_picture}`);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                setPreviewImage(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${data.profile_picture}`);
                setMessage({ type: 'success', text: 'Profile picture updated!' });

                // Notify parent if needed
                if (onUpdate) onUpdate({ ...user, profile_picture: data.profile_picture });
            } else {
                setMessage({ type: 'error', text: data.error || 'Upload failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Upload failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                if (onUpdate) onUpdate(data.user);
            } else {
                setMessage({ type: 'error', text: data.error || 'Update failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Profile Settings</h2>

            {message.text && (
                <div className={`p-4 mb-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column - Image */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-sm relative group">
                        {previewImage ? (
                            <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl text-gray-400">
                                👤
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <span className="text-white text-sm font-semibold">Change</span>
                        </div>
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </div>
                    <div className="text-center">
                        <h3 className="font-semibold text-gray-800">{formData.full_name || 'User'}</h3>
                        <p className="text-sm text-gray-500">{formData.job_title || 'No Title'}</p>
                    </div>
                </div>

                {/* Right Column - Form */}
                <div className="flex-1">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{'Full Name'}</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{'Email'}</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{'Job Title'}</label>
                                <input
                                    type="text"
                                    name="job_title"
                                    value={formData.job_title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="e.g. ESG Manager"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{'Phone Number'}</label>
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{'Bio'}</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Tell us a little about yourself..."
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
