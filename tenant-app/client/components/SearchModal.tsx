import { useState, useEffect } from "react";
import { X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getStorefrontProductsWithPagination } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onAddToCart?: (productId: string) => void;
  formatPriceFn?: (price: number) => string;
}

export default function SearchModal({
  isOpen,
  onClose,
  tenantId,
  onAddToCart,
  formatPriceFn = formatPrice,
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const ITEMS_PER_PAGE = 20;

  const handleSearch = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setCurrentPage(1);
      setTotalPages(0);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const response = await getStorefrontProductsWithPagination(tenantId, {
        search: query,
        page,
        limit: ITEMS_PER_PAGE,
      });

      setResults(response.data);
      setTotalPages(response.pagination.pages);
      setCurrentPage(page);
    } catch (error) {
      toast.error("Failed to search products");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const onSearchButtonClick = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery, 1);
    }
  };

  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchButtonClick();
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handleSearch(searchQuery, currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handleSearch(searchQuery, currentPage - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="search-modal-header">
          <h2>Search Products</h2>
          <button
            className="search-modal-close"
            onClick={onClose}
            aria-label="Close search"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Input */}
        <div className="search-modal-search-box">
          {/* <Search className="search-modal-search-icon" size={20} /> */}
          <input
            type="text"
            placeholder="Search by product name or description..."
            value={searchQuery}
            onChange={onSearchChange}
            onKeyPress={onKeyPress}
            className="search-modal-input"
            autoFocus
          />
          <button
            className="search-modal-search-btn"
            onClick={onSearchButtonClick}
            disabled={loading || !searchQuery.trim()}
          >
            Search
          </button>
        </div>

        {/* Results */}
        <div className="search-modal-results">
          {loading ? (
            <div className="search-modal-loading">
              <div className="search-modal-spinner"></div>
              <p>Searching...</p>
            </div>
          ) : !hasSearched ? (
            <div className="search-modal-empty">
              <Search size={48} />
              <p>Start typing to search products</p>
            </div>
          ) : results.length === 0 ? (
            <div className="search-modal-empty">
              <Search size={48} />
              <p>No products found</p>
              <p className="search-modal-empty-hint">Try different keywords</p>
            </div>
          ) : (
            <div className="search-modal-grid">
              {results.map((product) => (
                <div key={product.id} className="search-modal-product-card">
                  {product.imageUrl && (
                    <div className="search-modal-product-image">
                      <img src={product.imageUrl} alt={product.name} />
                    </div>
                  )}
                  <div className="search-modal-product-details">
                    <h4 className="search-modal-product-name">{product.name}</h4>
                    <p className="search-modal-product-desc">
                      {product.description}
                    </p>
                    <div className="search-modal-product-footer">
                      <span className="search-modal-product-price">
                        {formatPriceFn(product.price)}
                      </span>
                      {onAddToCart && (
                        <button
                          className="search-modal-add-btn"
                          onClick={() => {
                            onAddToCart(product.id);
                            toast.success("Added to cart");
                          }}
                          disabled={product.stock_quantity === 0}
                        >
                          {product.stock_quantity > 0 ? "Add" : "Out of Stock"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {hasSearched && results.length > 0 && totalPages > 1 && (
          <div className="search-modal-pagination">
            <button
              className="search-modal-pagination-btn"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="search-modal-pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="search-modal-pagination-btn"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
