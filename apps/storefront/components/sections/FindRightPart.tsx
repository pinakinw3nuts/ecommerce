"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function FindRightPart() {
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ year, make, model });
    // Implement search functionality
  };
  
  return (
    <section className="bg-black text-white py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">FIND THE RIGHT PART</h1>
          <p className="text-sm mb-6">Select your vehicle to find parts that fit. We'll guide you through the process.</p>
          
          <div className="bg-white p-5 rounded">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="year" className="block text-gray-700 text-sm mb-1">
                    Year
                  </label>
                  <select
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                    <option value="2020">2020</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="make" className="block text-gray-700 text-sm mb-1">
                    Make
                  </label>
                  <select
                    id="make"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    required
                  >
                    <option value="">Select Make</option>
                    <option value="bmw">BMW</option>
                    <option value="mercedes">Mercedes</option>
                    <option value="audi">Audi</option>
                    <option value="vw">Volkswagen</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="model" className="block text-gray-700 text-sm mb-1">
                    Model
                  </label>
                  <select
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    required
                  >
                    <option value="">Select Model</option>
                    <option value="3-series">3 Series</option>
                    <option value="5-series">5 Series</option>
                    <option value="x5">X5</option>
                    <option value="x3">X3</option>
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700"
              >
                SEARCH PARTS
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
} 