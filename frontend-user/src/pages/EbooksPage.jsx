import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEbooks } from '../api';

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState([]);
  const [filteredEbooks, setFilteredEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    getEbooks()
      .then(res => {
        const data = res.data.data || [];
        setEbooks(data);
        setFilteredEbooks(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let results = ebooks;
    
    if (filterType !== 'all') {
      results = results.filter(ebook => 
        ebook.file_type === filterType || 
        (filterType === 'html' && ebook.file_url?.endsWith('.html')) ||
        (filterType === 'pdf' && ebook.file_url?.endsWith('.pdf'))
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(ebook => 
        ebook.title.toLowerCase().includes(query) ||
        (ebook.description && ebook.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredEbooks(results);
  }, [searchQuery, filterType, ebooks]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#b0bedb]">Loading ebooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f1c]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a0e1a] to-[#0f172a] border-b border-[#00d4ff]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ebooks & Guides Library</h1>
          <p className="text-[#b0bedb] text-sm sm:text-base">Free educational resources about blockchain, trading, and the VexaTrade Ecosystem</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-16 z-40 bg-[#0b0f1c]/95 backdrop-blur-sm border-b border-[#1e2a3a] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search ebooks by title or description..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full bg-[#0f1422] border border-[#2a3440] rounded-xl pl-4 pr-10 py-2.5 text-white placeholder-[#6c86a3] focus:outline-none focus:border-[#00d4ff] transition"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6c86a3] hover:text-white">
                  ✕
                </button>
              )}
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  filterType === 'all' 
                    ? 'bg-[#00d4ff] text-black' 
                    : 'bg-[#0f1422] text-[#b0bedb] border border-[#2a3440] hover:border-[#00d4ff]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('html')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  filterType === 'html' 
                    ? 'bg-[#00d4ff] text-black' 
                    : 'bg-[#0f1422] text-[#b0bedb] border border-[#2a3440] hover:border-[#00d4ff]'
                }`}
              >
                📘 HTML
              </button>
              <button
                onClick={() => setFilterType('pdf')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  filterType === 'pdf' 
                    ? 'bg-[#00d4ff] text-black' 
                    : 'bg-[#0f1422] text-[#b0bedb] border border-[#2a3440] hover:border-[#00d4ff]'
                }`}
              >
                📕 PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-sm text-[#6c86a3]">
          Showing {filteredEbooks.length} of {ebooks.length} ebooks
          {searchQuery && ` matching "${searchQuery}"`}
          {filterType !== 'all' && ` • Filtered by: ${filterType.toUpperCase()}`}
        </p>
      </div>

      {/* Ebooks Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        {filteredEbooks.length === 0 ? (
          <div className="text-center py-16 bg-[#0f1422] rounded-2xl">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-white mb-2">No ebooks found</h3>
            <p className="text-[#b0bedb] text-sm">
              {searchQuery ? `No ebooks matching "${searchQuery}"` : 'No ebooks available yet'}
            </p>
            {(searchQuery || filterType !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setFilterType('all'); }} 
                className="mt-4 text-[#00d4ff] hover:underline text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredEbooks.map(ebook => (
              <div key={ebook.id} className="group bg-[#0f1422] rounded-xl overflow-hidden border border-[#1e2a3a] hover:border-[#00d4ff] transition-all duration-300 hover:transform hover:-translate-y-1 flex flex-col">
                {/* Cover Image - Clickable */}
                <Link to={`/ebook/${ebook.id}`} className="block">
                  {ebook.cover_image_url ? (
                    <div className="overflow-hidden h-48">
                      <img src={ebook.cover_image_url} alt={ebook.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-[#0f1422] to-[#0a0e1a] flex items-center justify-center">
                      <span className="text-5xl">📘</span>
                    </div>
                  )}
                </Link>
                
                <div className="p-4 flex flex-col flex-grow">
                  {/* Type Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#00d4ff]/10 text-[#00d4ff]">
                      {ebook.file_type === 'html' || ebook.file_url?.endsWith('.html') ? '📘 HTML Ebook' : '📕 PDF Document'}
                    </span>
                  </div>
                  
                  {/* Title - Clickable */}
                  <Link to={`/ebook/${ebook.id}`} className="block">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 text-base hover:text-[#00d4ff] transition">
                      {ebook.title}
                    </h3>
                  </Link>
                  
                  {/* Description */}
                  <p className="text-sm text-[#b0bedb] line-clamp-2 mb-4 flex-grow">
                    {ebook.description || 'No description available'}
                  </p>
                  
                  {/* VISIBLE BUTTON - FIXED */}
                  <Link 
                    to={`/ebook/${ebook.id}`}
                    className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#00d4ff] to-[#00b8e6] text-black font-bold px-4 py-2.5 rounded-lg hover:from-[#00b8e6] hover:to-[#0099cc] transition-all duration-300 text-sm shadow-lg hover:shadow-[#00d4ff]/20"
                  >
                    📖 View Details
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}