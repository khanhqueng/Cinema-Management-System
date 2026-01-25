import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { theaterService } from '../services/theaterService';
import { showtimeService } from '../services/showtimeService';
import { Theater, TheaterType, PageResponse, Showtime } from '../types';
import styles from './TheaterPage.module.css';

const TheaterPage: React.FC = () => {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TheaterType | ''>('');
  const [theaterTypes, setTheaterTypes] = useState<TheaterType[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    fetchTheaterTypes();
    fetchTheaters();
  }, []);

  useEffect(() => {
    fetchTheaters();
  }, [currentPage, selectedType]);

  const fetchTheaterTypes = async () => {
    try {
      const types = await theaterService.getTheaterTypes();
      setTheaterTypes(types);
    } catch (err) {
      console.error('Error fetching theater types:', err);
    }
  };

  const fetchTheaters = async () => {
    try {
      setLoading(true);
      let theatersResponse: PageResponse<Theater>;

      if (searchQuery.trim()) {
        theatersResponse = await theaterService.searchTheaters({
          name: searchQuery,
          page: currentPage,
          size: pageSize
        });
      } else if (selectedType) {
        theatersResponse = await theaterService.getTheatersByType({
          type: selectedType,
          page: currentPage,
          size: pageSize
        });
      } else {
        theatersResponse = await theaterService.getAllTheaters({
          page: currentPage,
          size: pageSize,
          sortBy: 'name',
          sortDir: 'asc'
        });
      }

      setTheaters(theatersResponse.content);
      setTotalPages(theatersResponse.totalPages);
      setTotalElements(theatersResponse.totalElements);
    } catch (err) {
      setError('Failed to fetch theaters');
      console.error('Error fetching theaters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    setSelectedType('');
    fetchTheaters();
  };

  const handleTypeFilter = (type: TheaterType | '') => {
    setSelectedType(type);
    setSearchQuery('');
    setCurrentPage(0);
    fetchTheaters();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setCurrentPage(0);
    fetchTheaters();
  };

  if (loading && theaters.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading theaters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Theaters</h2>
        <p>{error}</p>
        <button onClick={fetchTheaters} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Our Theaters</h1>
          <p className={styles.subtitle}>
            Experience movies like never before in our state-of-the-art theaters
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className={styles.contentSection}>
        <div className={styles.contentContainer}>
          {/* Search and Filters */}
          <div className={styles.filtersContainer}>
            <div className={styles.searchSection}>
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <input
                  type="text"
                  placeholder="Search theaters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <button type="submit" className={styles.searchButton}>
                  Search
                </button>
              </form>
            </div>

            <div className={styles.filtersSection}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Theater Type:</label>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeFilter(e.target.value as TheaterType | '')}
                  className={styles.select}
                >
                  <option value="">All Types</option>
                  {theaterTypes.map(type => (
                    <option key={type} value={type}>
                      {theaterService.getTheaterTypeDisplay(type)}
                    </option>
                  ))}
                </select>
              </div>

              {(searchQuery || selectedType) && (
                <button onClick={clearFilters} className={styles.clearButton}>
                  Clear Filters
                </button>
              )}
            </div>

            <div className={styles.resultsInfo}>
              Showing {theaters.length} of {totalElements} theaters
            </div>
          </div>

          {/* Theaters Grid */}
          {theaters.length === 0 ? (
            <div className={styles.noResults}>
              <h3>No Theaters Found</h3>
              <p>
                {searchQuery || selectedType
                  ? 'Try adjusting your filters to see more results.'
                  : 'No theaters are currently available.'}
              </p>
            </div>
          ) : (
            <div className={styles.theatersGrid}>
              {theaters.map((theater) => (
                <TheaterCard key={theater.id} theater={theater} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
                className={currentPage === 0 ? styles.disabledPageButton : styles.pageButton}
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
                className={currentPage === 0 ? styles.disabledPageButton : styles.pageButton}
              >
                Previous
              </button>

              <span className={styles.pageInfo}>
                Page {currentPage + 1} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className={currentPage >= totalPages - 1 ? styles.disabledPageButton : styles.pageButton}
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                className={currentPage >= totalPages - 1 ? styles.disabledPageButton : styles.pageButton}
              >
                Last
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Theater Card Component
const TheaterCard: React.FC<{ theater: Theater }> = ({ theater }) => {
  const [upcomingShowtimes, setUpcomingShowtimes] = useState<Showtime[]>([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(true);

  useEffect(() => {
    const fetchUpcomingShowtimes = async () => {
      try {
        const showtimesResponse = await showtimeService.getShowtimesByTheater(theater.id, {
          size: 3
        });
        setUpcomingShowtimes(showtimesResponse.content.slice(0, 3));
      } catch (err) {
        console.error('Error fetching showtimes:', err);
      } finally {
        setLoadingShowtimes(false);
      }
    };

    fetchUpcomingShowtimes();
  }, [theater.id]);

  return (
    <div className={styles.theaterCard}>
      <div className={styles.theaterHeader}>
        <div className={styles.theaterIcon}>
          {theaterService.getTheaterTypeIcon(theater.theaterType)}
        </div>
        <div className={styles.theaterInfo}>
          <h3 className={styles.theaterName}>{theater.name}</h3>
          <div className={styles.theaterMeta}>
            <span className={styles.theaterType}>
              {theaterService.getTheaterTypeDisplay(theater.theaterType)}
            </span>
            <span className={styles.capacity}>
              {theater.capacity} seats ({theaterService.getCapacityCategory(theater.capacity)})
            </span>
          </div>
        </div>
      </div>

      <div className={styles.showtimesContainer}>
        <h4 className={styles.showtimesHeader}>Upcoming Showtimes</h4>
        {loadingShowtimes ? (
          <div className={styles.showtimesLoading}>Loading...</div>
        ) : upcomingShowtimes.length > 0 ? (
          <div className={styles.showtimesList}>
            {upcomingShowtimes.map(showtime => (
              <div key={showtime.id} className={styles.showtimeItem}>
                <div className={styles.movieTitle}>{showtime.movieTitle}</div>
                <div className={styles.showtimeDetails}>
                  <span className={styles.showtimeTime}>
                    {showtimeService.formatShowTime(showtime)}
                  </span>
                  <span className={styles.showtimeDate}>
                    {new Date(showtime.showDatetime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noShowtimes}>No upcoming showtimes</div>
        )}
      </div>

      <div className={styles.theaterActions}>
        <Link
          to={`/theaters/${theater.id}/showtimes`}
          className={styles.viewShowtimesButton}
        >
          View All Showtimes
        </Link>
      </div>
    </div>
  );
};

export default TheaterPage;