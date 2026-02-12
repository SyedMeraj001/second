import React, { useState, useEffect } from 'react';

const CustomTaxonomyBuilder = ({ onClose }) => {
  const [taxonomies, setTaxonomies] = useState([]);
  const [currentTaxonomy, setCurrentTaxonomy] = useState({
    name: '',
    description: '',
    categories: []
  });
  const [editingCategory, setEditingCategory] = useState(null);

  const defaultCategories = [
    { id: 'environmental', name: 'Environmental', metrics: [] },
    { id: 'social', name: 'Social', metrics: [] },
    { id: 'governance', name: 'Governance', metrics: [] }
  ];

  useEffect(() => {
    loadTaxonomies();
  }, []);

  const loadTaxonomies = async () => {
    try {
      const response = await fetch('/api/esg/taxonomies');
      const data = await response.json();
      setTaxonomies(data || []);
    } catch (error) {
      console.error('Failed to load taxonomies:', error);
    }
  };

  const saveTaxonomy = async () => {
    try {
      const response = await fetch('/api/esg/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTaxonomy)
      });
      
      if (response.ok) {
        loadTaxonomies();
        setCurrentTaxonomy({ name: '', description: '', categories: [] });
        alert('Taxonomy saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save taxonomy:', error);
    }
  };

  const addCategory = () => {
    const newCategory = {
      id: Date.now().toString(),
      name: 'New Category',
      description: '',
      metrics: []
    };
    setCurrentTaxonomy(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  const addMetric = (categoryId) => {
    const newMetric = {
      id: Date.now().toString(),
      name: 'New Metric',
      type: 'number',
      unit: '',
      required: false,
      griCode: '',
      description: ''
    };
    
    setCurrentTaxonomy(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, metrics: [...cat.metrics, newMetric] }
          : cat
      )
    }));
  };

  const updateCategory = (categoryId, field, value) => {
    setCurrentTaxonomy(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const updateMetric = (categoryId, metricId, field, value) => {
    setCurrentTaxonomy(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              metrics: cat.metrics.map(metric =>
                metric.id === metricId ? { ...metric, [field]: value } : metric
              )
            }
          : cat
      )
    }));
  };

  const deleteCategory = (categoryId) => {
    setCurrentTaxonomy(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== categoryId)
    }));
  };

  const deleteMetric = (categoryId, metricId) => {
    setCurrentTaxonomy(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, metrics: cat.metrics.filter(m => m.id !== metricId) }
          : cat
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Custom ESG Taxonomy Builder</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Existing Taxonomies */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Existing Taxonomies</h3>
            <div className="space-y-2">
              {taxonomies.map(taxonomy => (
                <div key={taxonomy.id} className="p-3 bg-white rounded border cursor-pointer hover:bg-blue-50"
                     onClick={() => setCurrentTaxonomy(taxonomy)}>
                  <div className="font-medium">{taxonomy.name}</div>
                  <div className="text-sm text-gray-600">{taxonomy.categories?.length || 0} categories</div>
                </div>
              ))}
            </div>
            <button onClick={() => setCurrentTaxonomy({ name: '', description: '', categories: [...defaultCategories] })}
                    className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              New Taxonomy
            </button>
          </div>

          {/* Taxonomy Editor */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <input
                type="text"
                placeholder="Taxonomy Name"
                value={currentTaxonomy.name}
                onChange={(e) => setCurrentTaxonomy(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded mb-2"
              />
              <textarea
                placeholder="Description"
                value={currentTaxonomy.description}
                onChange={(e) => setCurrentTaxonomy(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded mb-2"
                rows="2"
              />
              <div className="flex gap-2">
                <button onClick={saveTaxonomy} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Save Taxonomy
                </button>
                <button onClick={addCategory} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Add Category
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              {currentTaxonomy.categories?.map(category => (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                      className="font-semibold text-lg border-none bg-transparent"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => addMetric(category.id)}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                        Add Metric
                      </button>
                      <button onClick={() => deleteCategory(category.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                        Delete
                      </button>
                    </div>
                  </div>

                  <textarea
                    placeholder="Category description"
                    value={category.description || ''}
                    onChange={(e) => updateCategory(category.id, 'description', e.target.value)}
                    className="w-full p-2 border rounded mb-3"
                    rows="2"
                  />

                  {/* Metrics */}
                  <div className="space-y-2">
                    {category.metrics?.map(metric => (
                      <div key={metric.id} className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Metric Name"
                            value={metric.name}
                            onChange={(e) => updateMetric(category.id, metric.id, 'name', e.target.value)}
                            className="p-1 border rounded text-sm"
                          />
                          <select
                            value={metric.type}
                            onChange={(e) => updateMetric(category.id, metric.id, 'type', e.target.value)}
                            className="p-1 border rounded text-sm"
                          >
                            <option value="number">Number</option>
                            <option value="text">Text</option>
                            <option value="percentage">Percentage</option>
                            <option value="currency">Currency</option>
                            <option value="date">Date</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Unit"
                            value={metric.unit || ''}
                            onChange={(e) => updateMetric(category.id, metric.id, 'unit', e.target.value)}
                            className="p-1 border rounded text-sm"
                          />
                          <input
                            type="text"
                            placeholder="GRI Code"
                            value={metric.griCode || ''}
                            onChange={(e) => updateMetric(category.id, metric.id, 'griCode', e.target.value)}
                            className="p-1 border rounded text-sm"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={metric.required}
                              onChange={(e) => updateMetric(category.id, metric.id, 'required', e.target.checked)}
                              className="mr-1"
                            />
                            Required
                          </label>
                          <button onClick={() => deleteMetric(category.id, metric.id)}
                                  className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomTaxonomyBuilder;