# DB Update

All 160+ CSVs from PokeAPI have been downloaded and populated into the `pokedex_full.sqlite` DB. 
This includes `locations`, `location_areas`, `encounters`, `pokemon`, `moves`, `types`, etc. 
No data is left behind! The game engine has been modified to use location data (`kanto-route-1` by default) to spawn wild pokemon.
