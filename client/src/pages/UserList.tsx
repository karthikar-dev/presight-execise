import { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface User {
    id: string;
    avatar: string;
    first_name: string;
    last_name: string;
    age: number;
    nationality: string;
    hobbies: string[];
}

interface Stats {
    hobbies: Array<{ name: string; count: number }>;
    nationalities: Array<{ name: string; count: number }>;
}

interface ApiResponse {
    data: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

function UserList() {
    const [allUsers, setAllUsers] = useState<User[]>([]); // Cache all loaded users
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats>({ hobbies: [], nationalities: [] });
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedNationality, setSelectedNationality] = useState('');
    const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [showHobbiesPopup, setShowHobbiesPopup] = useState(false);
    const [selectedUserHobbies, setSelectedUserHobbies] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const parentRef = useRef<HTMLDivElement>(null);

    // Fetch hobbies stats on mount
    useEffect(() => {
        fetch('/api/users/stats')
            .then(res => res.json())
            .then((data: Stats) => setStats(data));
    }, []);

    // Calculate real-time nationality counts from all loaded users
    const nationalityCounts = useCallback(() => {
        const counts: Record<string, number> = {};
        allUsers.forEach(user => {
            counts[user.nationality] = (counts[user.nationality] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
    }, [allUsers]);

    // Fetch users from API (no filters, just pagination)
    const fetchUsers = useCallback(async (pageNum: number, reset = false) => {
        setLoading(prev => {
            if (prev) return prev; // Already loading, skip
            return true;
        });

        const params = new URLSearchParams({
            page: pageNum.toString(),
            limit: '20'
        });

        try {
            const response = await fetch(`/api/users?${params}`);
            const data: ApiResponse = await response.json();

            if (reset) {
                setAllUsers(data.data);
            } else {
                setAllUsers(prev => [...prev, ...data.data]);
            }

            setHasMore(data.pagination.hasMore);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load only
    useEffect(() => {
        setAllUsers([]);
        setPage(1);
        fetchUsers(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Client-side filtering
    useEffect(() => {
        let filtered = allUsers;

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(user => 
                `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower)
            );
        }

        // Apply nationality filter
        if (selectedNationality) {
            filtered = filtered.filter(user => user.nationality === selectedNationality);
        }

        // Apply hobbies filter
        if (selectedHobbies.length > 0) {
            filtered = filtered.filter(user => 
                selectedHobbies.every(hobby => user.hobbies.includes(hobby))
            );
        }

        setUsers(filtered);
    }, [allUsers, search, selectedNationality, selectedHobbies]);

    // Setup virtualizer
    const rowVirtualizer = useVirtualizer({
        count: users.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 162, // 150px + 12px spacing
        overscan: 5
    });

    // Infinite scroll for list view
    useEffect(() => {
        if (viewMode !== 'list') return;

        const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

        if (!lastItem) return;

        const hasFilters = !!(search || selectedNationality || selectedHobbies.length);

        if (
            lastItem.index >= users.length - 1 &&
            hasMore &&
            !loading &&
            allUsers.length >= users.length &&
+            !hasFilters
        ) {
            fetchUsers(page + 1, false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, rowVirtualizer.getVirtualItems(), users.length, hasMore, loading, page, allUsers.length, search, selectedNationality, selectedHobbies]);

    // Infinite scroll for grid view
    useEffect(() => {
        if (viewMode !== 'grid') return;

        const handleScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;

            const hasFilters = !!(search || selectedNationality || selectedHobbies.length);

            // Load more when user is near bottom (within 500px)
            if (scrollHeight - (scrollTop + clientHeight) < 500 && hasMore && !loading && allUsers.length >= users.length && !hasFilters) {
                fetchUsers(page + 1, false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, hasMore, loading, page, allUsers.length, users.length, search, selectedNationality, selectedHobbies]);

    const handleSearch = () => {
        setSearch(searchInput);
    };

    const toggleHobby = (hobby: string) => {
        setSelectedHobbies(prev =>
            prev.includes(hobby)
                ? prev.filter(h => h !== hobby)
                : [...prev, hobby]
        );
    };

    return (
        <div className={`max-w-[1440px] mx-auto px-6 py-6 ${viewMode === 'list' ? 'h-[calc(100vh-140px)]' : ''}`}>
            <div className={`flex gap-6 ${viewMode === 'list' ? 'h-full' : ''}`}>
                {/* Sidebar */}
                <div className="w-72 flex-shrink-0">
                    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${viewMode === 'list' ? 'h-full' : 'sticky top-4'} flex flex-col`}>
                        {/* Search */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Search
                            </h3>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search by name..."
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-600 placeholder:text-gray-400"
                            />
                            <button
                                onClick={handleSearch}
                                className="w-full mt-3 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm hover:shadow"
                            >
                                Search
                            </button>
                        </div>

                        {/* Nationalities */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Nationality
                            </h3>
                            <select
                                value={selectedNationality}
                                onChange={(e) => setSelectedNationality(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all text-gray-600"
                            >
                                <option value="">All Countries</option>
                                {nationalityCounts().map(nat => (
                                    <option key={nat.name} value={nat.name}>
                                        {nat.name} ({nat.count})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Hobbies */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">
                                Hobbies
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                                {stats.hobbies.map(hobby => (
                                    <label key={hobby.name} className="flex items-center px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedHobbies.includes(hobby.name)}
                                            onChange={() => toggleHobby(hobby.name)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-0"
                                        />
                                        <span className="ml-3 text-sm text-gray-900 flex-1">
                                            {hobby.name}
                                        </span>
                                        <span className="text-xs text-gray-500 font-medium">
                                            {hobby.count}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0 flex flex-col">
                    {/* View Mode Toggle */}
                    <div className="mb-4 flex items-center gap-2 justify-between flex-shrink-0">
                        <h1 className="text-2xl font-medium text-gray-900 text-white">
                            User List ({users.length})
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">View:</span>
                            <div className="flex bg-white/10 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${viewMode === 'list'
                                            ? 'bg-white text-gray-900 font-semibold shadow-sm'
                                            : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    List
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${viewMode === 'grid'
                                            ? 'bg-white text-gray-900 font-semibold shadow-sm'
                                            : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    Grid
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={parentRef}
                        className={viewMode === 'list' ? 'flex-1 overflow-auto' : ''}
                    >
                        {viewMode === 'list' ? (
                            <div
                                style={{
                                    height: `${rowVirtualizer.getTotalSize()}px`,
                                    width: '100%',
                                    position: 'relative'
                                }}
                            >
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const user = users[virtualRow.index];
                                    return (
                                        <div
                                            key={virtualRow.key}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                                paddingBottom: '12px'
                                            }}
                                        >
                                            <UserCard
                                                user={user}
                                                viewMode="list"
                                                onShowAllHobbies={(hobbies) => {
                                                    setSelectedUserHobbies(hobbies);
                                                    setShowHobbiesPopup(true);
                                                }}
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowUserDetails(true);
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                                {users.map((user) => (
                                    <UserCard
                                        key={user.id}
                                        user={user}
                                        viewMode="grid"
                                        onShowAllHobbies={(hobbies) => {
                                            setSelectedUserHobbies(hobbies);
                                            setShowHobbiesPopup(true);
                                        }}
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setShowUserDetails(true);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    {loading && (
                        <div className="text-center py-4">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Hobbies Popup Modal */}
            {showHobbiesPopup && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowHobbiesPopup(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">All Hobbies</h3>
                            <button
                                onClick={() => setShowHobbiesPopup(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                            {selectedUserHobbies.map((hobby, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                                >
                                    {hobby}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Popup Modal */}
            {showUserDetails && selectedUser && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowUserDetails(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                            <button
                                onClick={() => setShowUserDetails(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-col items-center">
                            {/* Photo */}
                            <img
                                src={selectedUser.avatar}
                                alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                                className="h-32 w-32 rounded-full shadow-lg mb-6"
                                loading="eager"
                                decoding="async"
                            />

                            {/* Details */}
                            <div className="w-full space-y-4">
                                <div className="border-b border-gray-200 pb-3">
                                    <label className="text-sm font-medium text-gray-500">Name</label>
                                    <p className="text-lg font-semibold text-gray-900 mt-1">
                                        {selectedUser.first_name} {selectedUser.last_name}
                                    </p>
                                </div>

                                <div className="border-b border-gray-200 pb-3">
                                    <label className="text-sm font-medium text-gray-500">Age</label>
                                    <p className="text-lg font-semibold text-gray-900 mt-1">
                                        {selectedUser.age} years
                                    </p>
                                </div>

                                <div className="border-b border-gray-200 pb-3">
                                    <label className="text-sm font-medium text-gray-500">Nationality</label>
                                    <p className="text-lg font-semibold text-gray-900 mt-1">
                                        {selectedUser.nationality}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-3 block">Hobbies</label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUser.hobbies.map((hobby, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                                            >
                                                {hobby}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface UserCardProps {
    user?: User;
    viewMode?: 'list' | 'grid';
    onShowAllHobbies?: (hobbies: string[]) => void;
    onClick?: () => void;
}

function UserCard({ user, viewMode = 'list', onShowAllHobbies, onClick }: UserCardProps) {
    if (!user) return null;

    const displayHobbies = user.hobbies.slice(0, 2);
    const remainingCount = user.hobbies.length - 2;

    if (viewMode === 'grid') {
        return (
            <div
                className="bg-white rounded-xl shadow-md p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200"
                onClick={onClick}
            >
                <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <img
                        src={user.avatar}
                        alt={`${user.first_name} ${user.last_name}`}
                        className="h-24 w-24 rounded-full shrink-0 shadow-sm mb-3"
                        loading="eager"
                        decoding="async"
                    />
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {user.first_name} {user.last_name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span>{user.nationality}</span>
                        <span>•</span>
                        <span>{user.age} years</span>
                    </div>
                    {user.hobbies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            {displayHobbies.map((hobby, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                                >
                                    {hobby}
                                </span>
                            ))}
                            {remainingCount > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onShowAllHobbies?.(user.hobbies);
                                    }}
                                    className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors cursor-pointer"
                                >
                                    +{remainingCount}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className="bg-white rounded-xl shadow-md p-6 mx-2 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200"
            onClick={onClick}
        >
            <div className="flex items-center gap-6">
                {/* Avatar */}
                <img
                    src={user.avatar}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="h-[100px] w-[100px] rounded-full shrink-0 shadow-sm"
                    loading="eager"
                    decoding="async"
                />
                <div className="flex-1 min-w-0">
                    {/* First line: first_name + last_name */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {user.first_name} {user.last_name}
                    </h3>
                    {/* Second line: nationality and age */}
                    <div className="flex items-center justify-between text-sm font-medium text-gray-500 mb-3">
                        <span>{user.nationality}</span>
                        <span>{user.age} years</span>
                    </div>
                    {/* Fourth line: hobbies - top 2 and +n */}
                    {user.hobbies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {displayHobbies.map((hobby, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                                >
                                    {hobby}
                                </span>
                            ))}
                            {remainingCount > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onShowAllHobbies?.(user.hobbies);
                                    }}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors cursor-pointer"
                                >
                                    +{remainingCount}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserList;
