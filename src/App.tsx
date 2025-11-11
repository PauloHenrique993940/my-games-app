import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { gameImages } from './assets/images';


/* ---------------------- Types ---------------------- */
type Game = {
  id: string;
  title: string;
  description: string;
  genre: string[];
  thumbnail: string;
  rating: number;
  releaseDate: string;
  favorites?: boolean;
};

type User = {
  id: string;
  name: string;
  email?: string;
  points?: number;
  avatar?: string;
};

/* ---------------------- Sample Data ---------------------- */
const SAMPLE_GAMES: Game[] = [
  {
    id: 'g1',
    title: 'Cyberpunk Odyssey',
    description: 'Exploração urbana futurista.',
    genre: ['RPG', 'Aventura'],
    thumbnail: gameImages.cyberpunk,
    rating: 4.6,
    releaseDate: '2024-09-10',
  },
  {
    id: 'g2',
    title: 'Star Ops: Frontline',
    description: 'FPS tático com equipes.',
    genre: ['FPS', 'Multiplayer'],
    thumbnail: gameImages.starops,
    rating: 4.8,
    releaseDate: '2023-05-25',
  },
  {
    id: 'g3',
    title: 'Mystic Realm',
    description: 'RPG de fantasia.',
    genre: ['RPG', 'Fantasy'],
    thumbnail: gameImages.mystic,
    rating: 4.3,
    releaseDate: '2022-11-02',
  },
  {
    id: 'g4',
    title: 'Speed Drift Legends',
    description: 'Corridas arcade.',
    genre: ['Corrida', 'Arcade'],
    thumbnail: gameImages.speed,
    rating: 4.1,
    releaseDate: '2021-07-12',
  },
];


/* ---------------------- Helper ---------------------- */
const uid = (prefix = '') =>
  `${prefix}${Math.random().toString(36).slice(2, 9)}`;

/* ---------------------- Component ---------------------- */
const App: React.FC = () => {
  /* ---------- App state ---------- */
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );

  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('gh_user');
    return raw ? JSON.parse(raw) : null;
  });

  const [games, setGames] = useState<Game[]>(() => {
    const raw = localStorage.getItem('gh_games');
    return raw ? JSON.parse(raw) : SAMPLE_GAMES;
  });

  const [page, setPage] = useState<
    'login' | 'home' | 'detail' | 'profile' | 'ranking' | 'admin'
  >(user ? 'home' : 'login');

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  /* Filters & UI */
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  /* Admin form */
  const [adminModeEditId, setAdminModeEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Game>>({});

  /* Persist theme and games and user */
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('gh_games', JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem('gh_user', JSON.stringify(user));
    if (user) setPage('home');
    else setPage('login');
  }, [user]);

  /* Derived data */
  const genres = useMemo(() => {
    const s = new Set<string>();
    games.forEach((g) => g.genre.forEach((gg) => s.add(gg)));
    return ['All', ...Array.from(s)];
  }, [games]);

  const filteredGames = useMemo(() => {
    return games
      .filter((g) => (showOnlyFavorites ? g.favorites === true : true))
      .filter((g) =>
        genreFilter === 'All' ? true : g.genre.includes(genreFilter)
      )
      .filter((g) => g.rating >= minRating)
      .filter((g) =>
        search.trim() === ''
          ? true
          : g.title.toLowerCase().includes(search.toLowerCase()) ||
            g.description.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.rating - a.rating);
  }, [games, search, genreFilter, minRating, showOnlyFavorites]);

  const selectedGame = useMemo(
    () => games.find((g) => g.id === selectedGameId) || null,
    [selectedGameId, games]
  );

  /* ---------- Actions ---------- */
  const handleLogin = (name: string, email?: string) => {
    const u: User = {
      id: uid('u_'),
      name,
      email,
      points: 0,
      avatar: `https://i.pravatar.cc/100?u=${name}`,
    };
    setUser(u);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedGameId(null);
    setSearch('');
    setGenreFilter('All');
    setPage('login');
  };

  const toggleFavorite = (id: string) => {
    setGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, favorites: !g.favorites } : g))
    );
  };

  /* Admin CRUD */
  const adminCreateOrUpdate = () => {
    if (!formData.title || !formData.thumbnail) {
      alert('Título e thumbnail obrigatórios.');
      return;
    }
    if (adminModeEditId) {
      setGames((prev) =>
        prev.map((g) =>
          g.id === adminModeEditId
            ? { ...g, ...(formData as Game), id: adminModeEditId }
            : g
        )
      );
      setAdminModeEditId(null);
    } else {
      const newGame: Game = {
        id: uid('g_'),
        title: String(formData.title),
        description: String(formData.description || ''),
        genre: (formData.genre && (formData.genre as unknown as string[])) || [
          'Indie',
        ],
        thumbnail: String(formData.thumbnail),
        rating: Number(formData.rating || 3.5),
        releaseDate: String(
          formData.releaseDate || new Date().toISOString().slice(0, 10)
        ),
      };
      setGames((prev) => [newGame, ...prev]);
    }
    setFormData({});
  };

  const adminEdit = (id: string) => {
    const g = games.find((x) => x.id === id);
    if (!g) return;
    setAdminModeEditId(id);
    setFormData({ ...g });
    setPage('admin');
  };

  const adminDelete = (id: string) => {
    if (!confirm('Remover jogo permanentemente?')) return;
    setGames((prev) => prev.filter((g) => g.id !== id));
  };

  /* small util: reset admin form */
  const adminClear = () => {
    setAdminModeEditId(null);
    setFormData({});
  };

  /* ---------- CSS (inline in JSX) ---------- */

  /* ---------- Render ---------- */
  return (
    <div className="app" style={{ padding: 20 }}>
      <div className="container">
        {/* Header */}
        <header className="app-header">
          <div className="brand">
            <div className="logo">GH</div>
            <div>
              <div className="title">GameHub</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Plataforma demo — tudo em 1 componente
              </div>
            </div>
          </div>

          <nav className="menu" role="navigation" aria-label="Main menu">
            {(['home', 'profile', 'ranking', 'admin'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPage(p);
                  setSelectedGameId(null);
                }}
                className={page === p ? 'active' : ''}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}

            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              title="Alternar tema"
              style={{ marginLeft: 8, padding: '8px 10px', borderRadius: 8 }}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>

            {user ? (
              <button
                onClick={handleLogout}
                style={{
                  marginLeft: 8,
                  background: 'transparent',
                  color: 'var(--muted)',
                  borderRadius: 8,
                }}
              >
                Sair
              </button>
            ) : (
              <button
                onClick={() => setPage('login')}
                style={{
                  marginLeft: 8,
                  background: 'transparent',
                  color: 'var(--muted)',
                  borderRadius: 8,
                }}
              >
                Entrar
              </button>
            )}
          </nav>
        </header>

        {/* Hero */}
        <div className="hero panel">
          <div className="hero-left">
            <h2>Bem-vindo à GameHub</h2>

            <p>
              Explore jogos, veja detalhes, comente e gerencie o catálogo — tudo
              em uma app demo.
            </p>
            <div className="actions">
              <button
                className="btn primary"
                onClick={() => {
                  setPage('home');
                  setSelectedGameId(null);
                }}
              >
                Explorar Jogos
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  setPage('admin');
                }}
              >
                Dashboard
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Usuário:</div>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={user.avatar}
                    alt="avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {user.points ?? 0} pts
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--muted)' }}>Não autenticado</div>
            )}
          </div>
        </div>

        {/* Main layout */}
        <div className="layout" style={{ marginTop: 14 }}>
          {/* Main column */}
          <main>
            <div className="panel">
              {/* Login */}
              {page === 'login' && !user && (
                <div>
                  <h3>Entrar / Cadastrar (demo)</h3>
                  <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
                    Preencha um nome para entrar rapidamente.
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      maxWidth: 520,
                    }}
                  >
                    <input
                      placeholder="Seu nome"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          handleLogin(
                            (e.target as HTMLInputElement).value || 'Jogador'
                          );
                      }}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.04)',
                        background: 'transparent',
                        color: 'inherit',
                        flex: 1,
                      }}
                    />
                    <button
                      className="btn primary"
                      onClick={() => {
                        const input = (document.activeElement as HTMLElement)
                          ?.previousElementSibling as HTMLInputElement | null;
                        const name =
                          (input && input.value.trim()) ||
                          prompt('Nome para login (demo)') ||
                          'Jogador';
                        handleLogin(name);
                      }}
                    >
                      Entrar
                    </button>
                  </div>
                </div>
              )}

              {/* Home / Catalog */}
              {page === 'home' && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <h3>Catálogo de Jogos</h3>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                      {filteredGames.length} resultados
                    </div>
                  </div>

                  <div className="controls" style={{ marginTop: 12 }}>
                    <input
                      type="search"
                      placeholder="Buscar por título ou descrição..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                    >
                      {genres.map((g) => (
                        <option value={g} key={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <select
                      value={String(minRating)}
                      onChange={(e) => setMinRating(Number(e.target.value))}
                    >
                      <option value={0}>Qualquer avaliação</option>
                      <option value={4}>≥ 4.0</option>
                      <option value={4.5}>≥ 4.5</option>
                    </select>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: 'var(--muted)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={showOnlyFavorites}
                        onChange={(e) => setShowOnlyFavorites(e.target.checked)}
                      />
                      Favoritos
                    </label>
                  </div>

                  <div className="grid" style={{ marginTop: 12 }}>
                    {filteredGames.map((g) => (
                      <article className="card" key={g.id}>
                        <img src={g.thumbnail} alt={g.title} />
                        <div className="card-body">
                          <h3>{g.title}</h3>
                          <p>{g.description.slice(0, 80)}...</p>
                          <div className="meta">
                            <div
                              style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                              }}
                            >
                              <div className="chip">{g.genre.join(', ')}</div>
                              <div className="ratings">
                                ⭐ {g.rating.toFixed(1)}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="btn ghost"
                                onClick={() => {
                                  setSelectedGameId(g.id);
                                  setPage('detail');
                                }}
                              >
                                Detalhes
                              </button>
                              <button
                                className="btn primary"
                                onClick={() => {
                                  if (!user)
                                    return alert(
                                      'Faça login para favoritar/jogar (demo).'
                                    );
                                  toggleFavorite(g.id);
                                }}
                              >
                                {g.favorites ? '♥ Favorito' : '❤ Favoritar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                    {filteredGames.length === 0 && (
                      <div style={{ color: 'var(--muted)', padding: 12 }}>
                        Nenhum jogo encontrado.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Detail */}
              {page === 'detail' && selectedGame && (
                <div className="detail">
                  <img src={selectedGame.thumbnail} alt={selectedGame.title} />
                  <div className="right">
                    <h3>{selectedGame.title}</h3>
                    <div style={{ marginBottom: 8 }}>
                      <span className="chip">
                        {selectedGame.genre.join(' • ')}
                      </span>{' '}
                      <span style={{ marginLeft: 8 }} className="ratings">
                        ⭐ {selectedGame.rating.toFixed(1)}
                      </span>
                    </div>
                    <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
                      {selectedGame.description}
                    </p>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn primary"
                        onClick={() =>
                          alert('Simulação: iniciando jogo... (demo)')
                        }
                      >
                        Jogar Agora
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() => {
                          if (!user)
                            return alert(
                              'Faça login para favoritar/jogar (demo).'
                            );
                          toggleFavorite(selectedGame.id);
                          setGames((g) => [...g]); // force re-render
                        }}
                      >
                        {selectedGame.favorites
                          ? 'Remover favorito'
                          : 'Adicionar aos favoritos'}
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() => {
                          setSelectedGameId(null);
                          setPage('home');
                        }}
                      >
                        Voltar
                      </button>
                    </div>

                    {/* Comments (simples) */}
                    <div style={{ marginTop: 18 }}>
                      <h4>Comentários</h4>
                      <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                        Sistema de comentários simulado — em uma app real
                        conecte uma API.
                      </p>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <input
                          placeholder="Escreva um comentário (demo)"
                          style={{
                            flex: 1,
                            padding: 8,
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.04)',
                            background: 'transparent',
                            color: 'inherit',
                          }}
                        />
                        <button
                          className="btn primary"
                          onClick={() => alert('Comentário enviado (demo).')}
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile */}
              {page === 'profile' && user && (
                <div>
                  <h3>Perfil — {user.name}</h3>
                  <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <div className="avatar" style={{ width: 120, height: 120 }}>
                      <img src={user.avatar} alt="avatar" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>
                        {user.name}
                      </div>
                      <div style={{ color: 'var(--muted)' }}>
                        {user.email || 'email@demo.local'}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <strong>{user.points ?? 0}</strong> pontos
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <button
                          className="btn primary"
                          onClick={() => alert('Editar perfil (demo)')}
                        >
                          Editar perfil
                        </button>
                        <button
                          className="btn ghost"
                          onClick={() => {
                            setPage('home');
                          }}
                        >
                          Voltar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <h4>Favoritos</h4>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {games.filter((g) => g.favorites).length === 0 && (
                        <div style={{ color: 'var(--muted)' }}>
                          Nenhum favorito.
                        </div>
                      )}
                      {games
                        .filter((g) => g.favorites)
                        .map((g) => (
                          <div key={g.id} style={{ width: 120 }}>
                            <img
                              src={g.thumbnail}
                              alt={g.title}
                              style={{
                                width: '100%',
                                height: 70,
                                objectFit: 'cover',
                                borderRadius: 8,
                              }}
                            />
                            <div style={{ fontSize: 13 }}>{g.title}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ranking */}
              {page === 'ranking' && (
                <div>
                  <h3>Ranking Global</h3>
                  <div style={{ marginTop: 10 }}>
                    {[
                      { name: 'Paulo', pts: 7500 },
                      { name: 'Maria', pts: 6800 },
                      { name: 'Lucas', pts: 5900 },
                      { name: 'Ana', pts: 5400 },
                      { name: 'Rafa', pts: 5200 },
                    ].map((p, i) => (
                      <div
                        key={p.name}
                        className="row"
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.02)',
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          #{i + 1} <strong>{p.name}</strong>
                        </div>
                        <div style={{ fontWeight: 700 }}>{p.pts} pts</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin */}
              {page === 'admin' && user && (
                <div>
                  <h3>Admin Dashboard</h3>
                  <p style={{ color: 'var(--muted)' }}>
                    CRUD básico de jogos (persistido em localStorage)
                  </p>

                  <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div className="field">
                        <label>Título</label>
                        <input
                          value={formData.title ?? ''}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              title: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Thumbnail (URL)</label>
                        <input
                          value={formData.thumbnail ?? ''}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              thumbnail: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Gêneros (separar por vírgula)</label>
                        <input
                          value={
                            (formData.genre || []).join?.(',') ??
                            (formData.genre as any) ??
                            ''
                          }
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              genre: e.target.value
                                .split(',')
                                .map((s) => s.trim()),
                            }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.rating ?? 4}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              rating: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn primary"
                          onClick={adminCreateOrUpdate}
                        >
                          {adminModeEditId ? 'Salvar' : 'Criar'}
                        </button>
                        <button className="btn ghost" onClick={adminClear}>
                          Limpar
                        </button>
                      </div>
                    </div>

                    <div style={{ width: 320 }}>
                      <h4>Jogos (editar / remover)</h4>
                      <div
                        style={{
                          maxHeight: 320,
                          overflowY: 'auto',
                          marginTop: 8,
                        }}
                      >
                        {games.map((g) => (
                          <div
                            key={g.id}
                            style={{
                              display: 'flex',
                              gap: 8,
                              alignItems: 'center',
                              marginBottom: 8,
                              padding: 8,
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.02)',
                            }}
                          >
                            <img
                              src={g.thumbnail}
                              alt={g.title}
                              style={{
                                width: 64,
                                height: 44,
                                objectFit: 'cover',
                                borderRadius: 6,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700 }}>{g.title}</div>
                              <div
                                style={{ fontSize: 12, color: 'var(--muted)' }}
                              >
                                {g.genre.join(', ')}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn ghost"
                                onClick={() => adminEdit(g.id)}
                              >
                                Editar
                              </button>
                              <button
                                className="btn"
                                style={{
                                  background: '#ff4d4f',
                                  color: '#061025',
                                }}
                                onClick={() => adminDelete(g.id)}
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* If user not authorized for admin */}
              {page === 'admin' && !user && (
                <div>
                  <h3>Dashboard</h3>
                  <p style={{ color: 'var(--muted)' }}>
                    Você precisa entrar para acessar as ferramentas
                    administrativas (demo).
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Sidebar */}
          <aside>
            <div className="panel">
              <div className="sidebar-section profile">
                <div className="avatar">
                  <img
                    src={user?.avatar || 'https://i.pravatar.cc/100?u=guest'}
                    alt="avatar"
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {user?.name || 'Convidado'}
                  </div>
                  <div style={{ color: 'var(--muted)' }}>
                    {user?.email || '—'}
                  </div>
                </div>
              </div>

              <div className="sidebar-section">
                <h4>Top Jogos</h4>
                <div className="small-list" style={{ marginTop: 8 }}>
                  {games.slice(0, 4).map((g) => (
                    <div key={g.id} className="row">
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <img
                          src={g.thumbnail}
                          alt={g.title}
                          style={{
                            width: 48,
                            height: 34,
                            objectFit: 'cover',
                            borderRadius: 6,
                          }}
                        />
                        <div style={{ fontSize: 13 }}>{g.title}</div>
                      </div>
                      <div style={{ color: 'var(--muted)' }}>
                        ⭐ {g.rating.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sidebar-section">
                <h4>Atividades</h4>
                <div
                  style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}
                >
                  Feed simulado — ex.:{' '}
                  <strong>Paulo jogou Cyberpunk Odyssey</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer style={{ marginTop: 18 }}>
          <div style={{ color: 'var(--muted)' }}>
            Demo criada com React + Vite • Tema: {theme}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
