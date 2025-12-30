import React, { useState } from 'react';
import {useEffect} from 'react';
import axios from 'axios';
import Header from './Header';

function IssueForm () {

  const [formData, setFormData] = useState({
    issue: '',
    description: '',
    address: '',
    requireDepartment: '',
  });

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepts(true);
        const accessToken = localStorage.getItem('accessToken');
        const response = await axios.get('http://localhost:8000/api/v1/users/departments', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true
        });
        if (response.data.success) {
          setDepartments(response.data.data);
          setError('');
        }
      } catch (error) {
        console.error('Error fetching departments:', error.response?.data || error.message);
        setError('Failed to load departments');
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, []);

  const navigateToAboutPage = () => {
    window.location.href = '/issue-history';
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        setError('Session expired. Please login again.');
        return;
    }

    if (!formData.issue || !formData.description || !formData.address || !formData.requireDepartment) {
        setError('All fields are required');
        return;
    }

    try {
        setSubmitting(true);
        const response = await axios.post('http://localhost:8000/api/v1/users/issues/raise-issue', 
            formData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,  
                    'Content-Type': 'application/json'
                },
                withCredentials: true 
            }
        );
        console.log('Issue submitted successfully:', response.data);
        navigateToAboutPage();
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Error submitting issue';
        console.error('Error submitting issue:', errorMessage);
        setError(errorMessage);
    } finally {
        setSubmitting(false);
    }
};


  return (
    <div className="issue-form-container">
      <Header/>
      
      <div className="flex justify-center mt-12 px-2 sm:px-0">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xs sm:max-w-sm bg-white p-4 sm:p-6 shadow-lg border border-indigo-700 rounded-lg"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <input
            type="text"
            name="issue"
            placeholder="Issue"
            value={formData.issue}
            onChange={handleChange}
            required
            className="w-full mb-3 sm:mb-4 p-2 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full mb-3 sm:mb-4 p-2 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full mb-3 sm:mb-4 p-2 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={formData.requireDepartment}
            onChange={handleChange}
            name="requireDepartment"
            disabled={loadingDepts}
            required
            className="w-full mb-3 sm:mb-4 p-2 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-200"
          >
            <option value="">
              {loadingDepts ? 'Loading departments...' : 'Select required department'}
            </option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={submitting || loadingDepts}
            className="w-full py-2 sm:py-3 bg-indigo-600 text-white text-sm sm:text-base rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
      
    </div>
  );
};

export default IssueForm;
