-- Master Genres Seed
INSERT INTO genres (name) VALUES
('Action'), ('Adventure'), ('Comedy'), ('Drama'), ('Fantasy'),
('Horror'), ('Mystery'), ('Romance'), ('Sci-Fi'), ('Slice of Life'),
('Sports'), ('Supernatural')
ON CONFLICT (name) DO NOTHING;

-- Initial Admin Account Seed (password: AdminPass123!)
INSERT INTO users (id, display_name, username, email, password_hash, role) VALUES
('user-admin-001', 'System Admin', 'admin', 'admin@comicverse.com', '$2a$10$wK1V.X.B2i0m2O.k7.aD3.XQ8h1lQ9r1a8k2B2i0m2O.k7.aD3.XQ', 'admin')
ON CONFLICT (username) DO NOTHING;
