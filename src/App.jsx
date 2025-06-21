import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

import './App.css';

function App() {
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    const [forecastData, setForecastData] = useState(null);
    const [summaryData, setSummaryData] = useState(null);

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const [mapCenter, setMapCenter] = useState([52.2297, 21.0122]);
    const [markerPosition, setMarkerPosition] = useState(null);




    useEffect(() => {
        if (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);
            setMapCenter([lat, lon]);
            setMarkerPosition([lat, lon]);
        }
    }, [latitude, longitude]);




    function MapEvents() {
        const _map = useMapEvents({
            click: (e) => {
                const { lat, lng } = e.latlng;
                setLatitude(lat.toFixed(4));
                setLongitude(lng.toFixed(4));
                setMapCenter([lat, lng]);
                setMarkerPosition([lat, lng]);
            },
        });
        return null;
    }


    const getWeatherEmoji = (weathercode) => {
        switch (weathercode) {
            case 0: return '☀️';
            case 1: return '🌤️';
            case 2: return '⛅';
            case 3: return '☁️';
            case 45:
            case 48: return '🌫️';
            case 51:
            case 53:
            case 55: return '🌧️';
            case 56:
            case 57: return '🧊🌧️';
            case 61:
            case 63:
            case 65: return '☔';
            case 66:
            case 67: return '🥶☔';
            case 71:
            case 73:
            case 75: return '🌨️';
            case 77: return '❄️';
            case 80:
            case 81:
            case 82: return '🌧️';
            case 85:
            case 86: return '🌨️';
            case 95: return '⛈️';
            case 96:
            case 99: return '�️⛈️';
            default: return '❓';
        }
    };


    const formatHoursToHoursMinutes = (decimalHours) => {
        if (decimalHours === null || isNaN(decimalHours)) {
            return 'N/A';
        }
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return `${hours} h ${minutes} min`;
    };

    const fetchWeatherData = async () => {
        setError(null);
        setForecastData(null);
        setSummaryData(null);
        setLoading(true);

        const latStr = latitude.trim();
        const lonStr = longitude.trim();

        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);

        if (isNaN(lat) || isNaN(lon)) {
            setError('Szerokość i długość geograficzna muszą być liczbami.');
            setLoading(false);
            return;
        }

        try {
            const backendBaseUrl = 'https://weather-app-backend-xav1.onrender.com';
            const forecastUrl = `${backendBaseUrl}/api/weather/forecast?latitude=${encodeURIComponent(lat)}}&longitude=${encodeURIComponent(lon)}`;
            const summaryUrl = `${backendBaseUrl}/api/weather/summary?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`;
            const forecastResponse = await fetch(forecastUrl);
            if (!forecastResponse.ok) {
                const errorData = await forecastResponse.json();
                throw new Error(errorData.error || `Błąd prognozy: ${forecastResponse.status}`);
            }
            const forecastJson = await forecastResponse.json();
            setForecastData(forecastJson);

            const summaryResponse = await fetch(summaryUrl);
            if (!summaryResponse.ok) {
                const errorData = await summaryResponse.json();
                throw new Error(errorData.error || `Błąd podsumowania: ${summaryResponse.status}`);
            }
            const summaryJson = await summaryResponse.json();
            setSummaryData(summaryJson);

        } catch (err) {
            setError(`Wystąpił błąd: ${err.message}`);
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App">
            <h1>Aplikacja Pogodowa</h1>

            <div className="input-section">
                <div>
                    <label>
                        Szerokość geograficzna:
                        <input
                            type="number"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            placeholder="np. 52.2297"
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Długość geograficzna:
                        <input
                            type="number"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            placeholder="np. 21.0122"
                        />
                    </label>
                </div>
                <button onClick={fetchWeatherData} disabled={loading}>
                    {loading ? 'Ładowanie...' : 'Pobierz Pogodę'}
                </button>
            </div>

            {error && <p className="error-message">{error}</p>}


            <div className="map-container">
                <MapContainer center={mapCenter} zoom={7} scrollWheelZoom={true} style={{ height: '400px', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEvents />
                    {markerPosition && (
                        <Marker position={markerPosition}>
                            <Popup>
                                Aktulana lokalizacja
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>


            {forecastData && (
                <div className="forecast-section">
                    <h2>Prognoza na 7 dni:</h2>
                    <table className="forecast-table">
                        <thead>
                        <tr>
                            <th>Data</th>
                            <th>Pogoda</th>
                            <th>Temp. Min (°C)</th>
                            <th>Temp. Max (°C)</th>
                            <th>Energia PV (kWh)</th>

                        </tr>
                        </thead>
                        <tbody>
                        {forecastData.map((day, index) => (
                            <tr key={index}>
                                <td>{day.date}</td>
                                <td>{getWeatherEmoji(day.weathercode)} ({day.weathercode})</td>
                                <td>{day.temperature_min}</td>
                                <td>{day.temperature_max}</td>
                                <td>{day.estimated_energy_kwh}</td>

                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}


            {summaryData && (
                <div className="summary-section">
                    <h2>Podsumowanie Tygodnia:</h2>
                    <p>Minimalna temperatura w tygodniu: <span>{summaryData.minTemperatureOverall}°C</span></p>
                    <p>Maksymalna temperatura w tygodniu: <span>{summaryData.maxTemperatureOverall}°C</span></p>
                    <p>Średni czas ekspozycji na słońce: <span>{formatHoursToHoursMinutes(summaryData.averageSunshineExposureHours)}</span></p>
                    <p>Komentarz: <span>{summaryData.weeklyWeatherComment}</span></p>
                </div>
            )}
        </div>
    );
}

export default App;
