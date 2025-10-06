class GameDex {
    constructor() {
        this.pokemonList = [];
        this.currentPokemon = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialPokemon();
    }

    setupEventListeners() {
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');

        searchBtn.addEventListener('click', () => this.searchPokemon());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchPokemon();
            }
        });
    }

    async loadInitialPokemon() {
        this.showLoading(true);
        try {
            await this.fetchPokemonList();
            this.displayPokemonList();
        } catch (error) {
            this.showError('Błąd podczas ładowania listy Pokemonów: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async fetchPokemonList() {
        try {
            const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=20');
            if (!response.ok) {
                throw new Error(`Błąd HTTP! status: ${response.status}`);
            }
            const data = await response.json();
            this.pokemonList = data.results;
        } catch (error) {
            throw new Error('Nie udało się pobrać listy Pokemonów');
        }
    }

    async fetchPokemonDetails(pokemonUrl) {
        try {
            const response = await fetch(pokemonUrl);
            if (!response.ok) {
                throw new Error(`Błąd HTTP! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            throw new Error('Nie udało się pobrać szczegółów Pokemona');
        }
    }

    async searchPokemon() {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput.value.trim().toLowerCase();

        if (!searchTerm) {
            this.loadInitialPokemon();
            return;
        }

        this.showLoading(true);
        this.hideError();

        try {
            // Szukamy w już załadowanej liście
            const foundPokemon = this.pokemonList.find(pokemon => 
                pokemon.name.toLowerCase().includes(searchTerm)
            );

            if (foundPokemon) {
                const details = await this.fetchPokemonDetails(foundPokemon.url);
                this.displayPokemonDetails(details);
            } else {
                // Jeśli nie znaleziono w liście, spróbuj wyszukać po ID lub nazwie
                const pokemonId = parseInt(searchTerm);
                if (!isNaN(pokemonId) && pokemonId > 0 && pokemonId <= 1010) {
                    const details = await this.fetchPokemonDetails(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
                    this.displayPokemonDetails(details);
                } else {
                    this.showError('Nie znaleziono Pokemona o podanej nazwie lub ID');
                }
            }
        } catch (error) {
            this.showError('Błąd podczas wyszukiwania: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayPokemonList() {
        const pokemonListElement = document.getElementById('pokemonList');
        const pokemonDetailsElement = document.getElementById('pokemonDetails');
        
        pokemonDetailsElement.innerHTML = '';
        pokemonListElement.innerHTML = '';

        this.pokemonList.forEach(async (pokemon, index) => {
            const pokemonElement = document.createElement('div');
            pokemonElement.className = 'pokemon-item';
            pokemonElement.innerHTML = `
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png" 
                     alt="${pokemon.name}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qb2tlbW9uPC90ZXh0Pgo8L3N2Zz4K'">
                <div class="pokemon-info">
                    <h3>${this.capitalizeFirst(pokemon.name)}</h3>
                    <p>#${String(index + 1).padStart(3, '0')}</p>
                </div>
            `;

            pokemonElement.addEventListener('click', async () => {
                this.showLoading(true);
                try {
                    const details = await this.fetchPokemonDetails(pokemon.url);
                    this.displayPokemonDetails(details);
                } catch (error) {
                    this.showError('Błąd podczas ładowania szczegółów: ' + error.message);
                } finally {
                    this.showLoading(false);
                }
            });

            pokemonListElement.appendChild(pokemonElement);
        });
    }

    displayPokemonDetails(pokemon) {
        const pokemonDetailsElement = document.getElementById('pokemonDetails');
        const pokemonListElement = document.getElementById('pokemonList');
        
        pokemonListElement.innerHTML = '';

        const types = pokemon.types.map(type => type.type.name);
        const stats = pokemon.stats.map(stat => ({
            name: this.getStatName(stat.stat.name),
            value: stat.base_stat
        }));

        pokemonDetailsElement.innerHTML = `
            <h2>${this.capitalizeFirst(pokemon.name)}</h2>
            <div class="pokemon-image">
                <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" 
                     alt="${pokemon.name}"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qb2tlbW9uPC90ZXh0Pgo8L3N2Zz4K'">
            </div>
            
            <div class="types">
                ${types.map(type => `<span class="type-badge type-${type}">${this.capitalizeFirst(type)}</span>`).join('')}
            </div>

            <div class="pokemon-stats">
                <h3>Podstawowe informacje</h3>
                <div class="stat-item">
                    <span class="stat-name">Wzrost:</span>
                    <span class="stat-value">${pokemon.height / 10} m</span>
                </div>
                <div class="stat-item">
                    <span class="stat-name">Waga:</span>
                    <span class="stat-value">${pokemon.weight / 10} kg</span>
                </div>
                <div class="stat-item">
                    <span class="stat-name">Numer:</span>
                    <span class="stat-value">#${String(pokemon.id).padStart(3, '0')}</span>
                </div>
            </div>

            <div class="pokemon-stats">
                <h3>Statystyki</h3>
                ${stats.map(stat => `
                    <div class="stat-item">
                        <span class="stat-name">${stat.name}:</span>
                        <span class="stat-value">${stat.value}</span>
                    </div>
                `).join('')}
            </div>

            <button onclick="gameDex.showPokemonList()" style="
                width: 100%; 
                padding: 12px; 
                background: #667eea; 
                color: white; 
                border: none; 
                border-radius: 8px; 
                cursor: pointer; 
                font-size: 16px;
                margin-top: 20px;
            ">Powrót do listy</button>
        `;
    }

    showPokemonList() {
        const pokemonListElement = document.getElementById('pokemonList');
        const pokemonDetailsElement = document.getElementById('pokemonDetails');
        
        pokemonDetailsElement.innerHTML = '';
        this.displayPokemonList();
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        loadingElement.textContent = show ? 'Ładowanie...' : '';
    }

    showError(message) {
        const errorElement = document.getElementById('error');
        if (message) {
            errorElement.textContent = message;
        } else {
            errorElement.textContent = '';
        }
    }

    hideError() {
        const errorElement = document.getElementById('error');
        errorElement.textContent = '';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getStatName(statName) {
        const statNames = {
            'hp': 'HP',
            'attack': 'Atak',
            'defense': 'Obrona',
            'special-attack': 'Sp. Atak',
            'special-defense': 'Sp. Obrona',
            'speed': 'Szybkość'
        };
        return statNames[statName] || statName;
    }
}

// Inicjalizacja aplikacji
const gameDex = new GameDex();