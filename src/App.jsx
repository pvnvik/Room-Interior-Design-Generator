import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Share2, Palette, ArrowLeft, Grid, Save, Trash2, Image, Settings, Key } from 'lucide-react';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const App = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [styledImage, setStyledImage] = useState(null);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const designStyles = [
    { 
      id: 'modern', 
      name: 'Modern Minimalist', 
      color: '#2C3E50', 
      description: 'Clean lines, neutral colors',
      prompt: 'Transform this room into a modern minimalist style with clean lines, neutral color palette (whites, grays, blacks), minimal furniture, uncluttered spaces, geometric shapes, and contemporary lighting. Remove any clutter and emphasize simplicity and functionality.'
    },
    { 
      id: 'scandinavian', 
      name: 'Scandinavian', 
      color: '#ECF0F1', 
      description: 'Light, airy, functional',
      prompt: 'Redesign this room in Scandinavian style with light wood tones, white walls, cozy textiles, minimal decoration, natural light emphasis, functional furniture, hygge elements, and plants. Create a bright, airy, and warm atmosphere.'
    },
    { 
      id: 'industrial', 
      name: 'Industrial', 
      color: '#7F8C8D', 
      description: 'Raw materials, exposed elements',
      prompt: 'Transform this room into industrial style with exposed brick walls, metal fixtures, concrete floors, Edison bulb lighting, raw wood furniture, open pipes, steel beams, and vintage industrial pieces. Emphasize raw, unfinished materials.'
    },
    { 
      id: 'bohemian', 
      name: 'Bohemian', 
      color: '#E67E22', 
      description: 'Eclectic, colorful, relaxed',
      prompt: 'Redesign this room in bohemian style with vibrant colors, mixed patterns, layered textiles, plants, macramé, vintage furniture, eclectic decorations, floor cushions, and warm lighting. Create a free-spirited, artistic atmosphere.'
    },
    { 
      id: 'coastal', 
      name: 'Coastal', 
      color: '#3498DB', 
      description: 'Beach-inspired, breezy',
      prompt: 'Transform this room into coastal style with light blues and whites, natural textures, nautical elements, driftwood accents, linen fabrics, beach-inspired decor, large windows, and airy feel. Evoke a relaxed seaside atmosphere.'
    },
    { 
      id: 'midcentury', 
      name: 'Mid-Century Modern', 
      color: '#D35400', 
      description: 'Retro, warm woods',
      prompt: 'Redesign this room in mid-century modern style with iconic 1950s-60s furniture, warm wood tones (teak, walnut), geometric patterns, atomic age accents, tapered legs, statement lighting, and bold colors. Blend retro charm with functionality.'
    },
    { 
      id: 'farmhouse', 
      name: 'Farmhouse', 
      color: '#95A5A6', 
      description: 'Rustic, cozy, vintage',
      prompt: 'Transform this room into farmhouse style with shiplap walls, barn doors, vintage furniture, rustic wood elements, neutral colors with soft accents, cozy textiles, antique pieces, and country charm. Create a warm, inviting rural atmosphere.'
    },
    { 
      id: 'contemporary', 
      name: 'Contemporary', 
      color: '#8E44AD', 
      description: 'Current trends, bold',
      prompt: 'Redesign this room in contemporary style with current design trends, bold color accents, sleek furniture, artistic elements, mixed materials, statement pieces, innovative lighting, and sophisticated aesthetics. Make it cutting-edge and stylish.'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      const storedKey = localStorage.getItem('falai-api-key');
      if (storedKey) {
        setApiKey(storedKey);
      }

      const savedDesignsData = localStorage.getItem('saved-designs');
      if (savedDesignsData) {
        try {
          setSavedDesigns(JSON.parse(savedDesignsData));
        } catch (error) {
          console.log('Error loading saved designs');
        }
      }
    };
    loadData();
  }, []);

  const saveApiKey = (key) => {
    localStorage.setItem('falai-api-key', key);
    setApiKey(key);
    setShowApiInput(false);
    setError('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setStyledImage(null);
        setSelectedStyle(null);
        setCompareMode(false);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const applyStyle = async (styleId) => {
    if (!uploadedImage) return;
    
    if (!apiKey) {
      setError('Please set your fal.ai API key first');
      setShowApiInput(true);
      return;
    }
    
    setProcessing(true);
    setSelectedStyle(styleId);
    setError('');
    
    const style = designStyles.find(s => s.id === styleId);
    
    try {
      const response = await fetch(
        'https://queue.fal.run/fal-ai/flux-kontext/dev',
        {
          method: 'POST',
          headers: {
            'Authorization': `Key ${apiKey}`,
            'Content-Type': 'application/json', 
          },
          body: JSON.stringify({
            prompt: style.prompt,
            image_url: uploadedImage,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        console.error("API Error:", errorData);
        throw new Error(errorData.error || 'Failed to generate design. Check your API key or model status.');
      }

      let result = await response.json();
      console.log('API RESPONSE:', result);

      let pollCount = 0;
      const maxPolls = 20;

      while (
        (result.status === 'IN_QUEUE' || result.status === 'IN_PROGRESS') &&
        pollCount < maxPolls
      ) {
        pollCount++;
        await sleep(3000);
        
        const statusResponse = await fetch(result.status_url, {
          method: 'GET',
          headers: {
            'Authorization': `Key ${apiKey}`,
          },
        });

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error("Polling Error:", errorText);
          throw new Error('Failed to poll for image status. Server rejected the request.');
        }

        result = await statusResponse.json();
        console.log('Polling status:', result);
      }

      if (pollCount >= maxPolls) {
        throw new Error('Image generation timed out. Please try again.');
      }

      if (result.status === 'FAILED' || result.status === 'ERROR') {
        throw new Error(result.error || 'Image generation failed.');
      }

      // When status is COMPLETED, fetch the actual response with the image
      if (result.status === 'COMPLETED' && result.response_url) {
        const responseData = await fetch(result.response_url, {
          method: 'GET',
          headers: {
            'Authorization': `Key ${apiKey}`,
          },
        });

        if (!responseData.ok) {
          throw new Error('Failed to fetch final image data');
        }

        const finalResult = await responseData.json();
        console.log('Final result with image:', JSON.stringify(finalResult, null, 2));

        // Try different possible response structures
        const generatedImageUrl = 
          finalResult?.data?.images?.[0]?.url || 
          finalResult?.images?.[0]?.url || 
          finalResult?.data?.image?.url ||
          finalResult?.image?.url;

        if (!generatedImageUrl) {
          throw new Error('No image URL found in the final response');
        }

        setStyledImage(generatedImageUrl);
      } else {
        throw new Error('Unexpected response status: ' + result.status);
      }
      setProcessing(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to generate design. Please check your fal.ai API key and try again.');
      setProcessing(false);
      setSelectedStyle(null);
    }
  };

  const saveDesign = () => {
    if (!styledImage || !selectedStyle) return;
    
    const design = {
      id: Date.now(),
      original: uploadedImage,
      styled: styledImage,
      style: designStyles.find(s => s.id === selectedStyle).name,
      styleId: selectedStyle,
      timestamp: new Date().toISOString()
    };
    
    const newDesigns = [design, ...savedDesigns];
    setSavedDesigns(newDesigns);
    localStorage.setItem('saved-designs', JSON.stringify(newDesigns));
  };

  const deleteDesign = (id) => {
    const newDesigns = savedDesigns.filter(d => d.id !== id);
    setSavedDesigns(newDesigns);
    localStorage.setItem('saved-designs', JSON.stringify(newDesigns));
  };

  const downloadImage = (imageData, filename) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = imageData;
    link.click();
  };

  const shareDesign = async () => {
    if (!styledImage) return;
    
    try {
      const blob = await (await fetch(styledImage)).blob();
      const file = new File([blob], 'interior-design.png', { type: blob.type });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Interior Design',
          text: `Check out my ${designStyles.find(s => s.id === selectedStyle)?.name} design!`
        });
      } else {
        downloadImage(styledImage, 'interior-design.png');
      }
    } catch (error) {
      downloadImage(styledImage, 'interior-design.png');
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setStyledImage(null);
    setSelectedStyle(null);
    setCompareMode(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Interior Design Studio</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowApiInput(true)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {apiKey ? 'API Key Set' : 'Set API Key'}
              </button>
              {uploadedImage && (
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  New Upload
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">fal.ai API Key</h3>
              <button
                onClick={() => setShowApiInput(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enter your fal.ai API key to use AI-powered interior design transformations.
              Get your free API key at{' '}
              <a
                href="https://fal.ai/dashboard/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                fal.ai Dashboard
              </a>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your fal.ai API key"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
            />
            <button
              onClick={() => saveApiKey(apiKey)}
              disabled={!apiKey}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Save API Key
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!uploadedImage ? (
          /* Upload Section */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Transform Your Space with AI</h2>
                <p className="text-gray-600">Upload a photo of your room to see it reimagined in different design styles</p>
              </div>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-3 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer"
              >
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-700 mb-2">Click to upload room photo</p>
                <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {!apiKey && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">API Key Required</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        You'll need a fal.ai API key to generate designs. Click "Set API Key" above to get started.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Saved Designs Gallery */}
            {savedDesigns.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Saved Designs ({savedDesigns.length})
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {savedDesigns.map((design) => (
                    <div key={design.id} className="relative group">
                      <img
                        src={design.styled}
                        alt={design.style}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2">
                        <button
                          onClick={() => downloadImage(design.styled, `${design.style}-design.png`)}
                          className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDesign(design.id)}
                          className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-700">{design.style}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Design Studio */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Panel - Styles */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Design Styles</h3>
                <div className="space-y-2">
                  {designStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => applyStyle(style.id)}
                      disabled={processing}
                      className={`w-full text-left p-4 rounded-xl transition-all ${
                        selectedStyle === style.id
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                      } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: style.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{style.name}</p>
                          <p className={`text-xs ${selectedStyle === style.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                            {style.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Preview</h3>
                  <div className="flex gap-2 flex-wrap">
                    {styledImage && (
                      <>
                        <button
                          onClick={() => setCompareMode(!compareMode)}
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                            compareMode
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Grid className="w-4 h-4" />
                          Compare
                        </button>
                        <button
                          onClick={saveDesign}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={shareDesign}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                        <button
                          onClick={() => downloadImage(styledImage, 'styled-room.png')}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {processing ? (
                  <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">Generating {designStyles.find(s => s.id === selectedStyle)?.name} design...</p>
                      <p className="text-sm text-gray-500 mt-2">This may take 15-30 seconds</p>
                    </div>
                  </div>
                ) : compareMode && styledImage ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Original</p>
                      <img
                        src={uploadedImage}
                        alt="Original"
                        className="w-full rounded-xl shadow-lg"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {designStyles.find(s => s.id === selectedStyle)?.name}
                      </p>
                      <img
                        src={styledImage}
                        alt="Styled"
                        className="w-full rounded-xl shadow-lg"
                      />
                    </div>
                  </div>
                ) : (
                  <img
                    src={styledImage || uploadedImage}
                    alt="Room preview"
                    className="w-full rounded-xl shadow-lg"
                  />
                )}

                {!selectedStyle && !processing && (
                  <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-indigo-900 text-center">
                      Select a design style from the left to see AI transform your room ✨
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;