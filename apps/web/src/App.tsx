import React, { useState } from 'react';
import './App.css';
import MapView from './MapView';

function App() {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const handleAddressChange = async (value: string) => {
    setAddress(value);

    if (value.length < 4) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          value,
        )}&format=jsonv2&addressdetails=1&limit=5`,
      );
      const data = await res.json();
      setSuggestions(
        (data || []).map((item: any) => item.display_name as string),
      );
    } catch (e) {
      console.warn('Autocomplete failed', e);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <div className="shell">
      <div className="map-background">
        <MapView onAddressDetected={setAddress} />
      </div>

      <div className="overlay">
        <header className="top-bar">
          <div className="brand">
            <span className="brand-mark">JagAI</span>
            <span className="brand-subtitle">Medical Drone Delivery</span>
          </div>
          <div className="profile">
            <div className="profile-avatar">N</div>
            <div className="profile-info">
              <div className="profile-name">Narek</div>
              <div className="profile-role">Pilot / Dispatcher</div>
            </div>
          </div>
        </header>

        <main className="content">
          <aside className="sidebar">
            <h2>Request a Delivery</h2>
            <form className="request-form">
              <label>
                Delivery address
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="Use current location or enter address"
                />
                {(isLoadingSuggestions || suggestions.length > 0) && (
                  <div className="suggestions">
                    {isLoadingSuggestions && (
                      <div className="suggestion-item">Searching…</div>
                    )}
                    {!isLoadingSuggestions &&
                      suggestions.map((s) => (
                        <div
                          key={s}
                          className="suggestion-item"
                          onClick={() => {
                            setAddress(s);
                            setSuggestions([]);
                          }}
                        >
                          {s}
                        </div>
                      ))}
                  </div>
                )}
              </label>

              <label>
                Item needed
                <input
                  type="text"
                  placeholder="First‑aid kit, test kit, prescription"
                />
              </label>

              <label>
                Urgency
                <select defaultValue="normal">
                  <option value="normal">Normal (2–4 hours)</option>
                  <option value="priority">Priority (&lt; 60 minutes)</option>
                </select>
              </label>

              <button type="button">Request Drone</button>
            </form>
          </aside>

          <section className="spacer" />
        </main>
      </div>
    </div>
  );
}

export default App;
