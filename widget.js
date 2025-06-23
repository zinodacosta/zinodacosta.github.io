const widgetHTML = 
<div id="protonik-hydrogen-widget">
  <div id="corner-widget">
    <button id="toggle-widget">▲</button>
    <div id="code-minimized">
      <div id="corner-content">
        <div class="gauge-container">
          <div id="battery-gauge-container">
            <div class="wave-loader1"></div>
            <div id="battery-gauge-background">
              <div id="battery-gauge-level" class="gauge-level"></div>
              <img
                src="https://yourcdn.com/widgets/icons/battery.webp"
                alt="Battery"
                id="battery-gauge-image"
              />
            </div>
            <div id="battery-gauge-label">
              <span id="battery-gauge-percentage">0%</span>
            </div>
            <p class="gauge-text">Battery</p>
          </div>

          <div id="hydrogen-gauge-container">
            <div class="wave-loader2"></div>
            <div id="hydrogen-gauge-background">
              <div id="hydrogen-gauge-level" class="gauge-level"></div>
              <img
                src="https://yourcdn.com/widgets/icons/electrolyzer.webp"
                alt="Electrolyzer"
                id="hydrogen-gauge-image"
              />
            </div>
            <div id="hydrogen-gauge-label">
              <span id="hydrogen-gauge-percentage">0%</span>
            </div>
            <p class="gauge-text">Hydrogen</p>
          </div>
        </div>
        <div class="mode-container">
          <h3>Simulation Mode:</h3>
          <p id="simulation-state"></p>
          <div id="price-container">
            <p>Electricity Price: <span id="current-price"></span> €/MWh</p>
          </div>
          <div id="co2-container">
            <p>CO₂ Emission: <span id="carbon-intensity"></span></p>
          </div>
        </div>
      </div>
    </div>

    <div id="code-expanded" style="display: none">
      <div id="corner-content">

        <h2>Wholesale Price</h2>
        <canvas id="myChart" width="400" height="70"></canvas>

        <div id="graph-selector2">
          <h2 id="chart2-title">Electricity Consumption</h2>
          <h3>Select Power Generation:</h3>
          <div class="checkbox-container">
            <div class="checkbox-group">
              <input type="checkbox" value="browncoal" /> Brown Coal
              <input type="checkbox" value="biomass" /> Biomass
              <input type="checkbox" value="windoffshore" /> Wind Offshore
              <input type="checkbox" value="windonshore" /> Wind Onshore
              <input type="checkbox" value="hydroelectric" /> Hydroelectric
            </div>
            <div class="checkbox-group">
              <input type="checkbox" value="naturalgas" /> Natural Gas
              <input type="checkbox" value="blackcoal" /> Black Coal
              <input type="checkbox" value="photovoltaik" /> Photovoltaik
              <input type="checkbox" value="otherconventional" /> Other Conventional
              <input type="checkbox" value="otherrenewable" /> Other Renewable
            </div>
          </div>
          <div class="dropdown-container">
            <select id="mobile-dropdown">
              <option value="browncoal">Brown Coal</option>
              <option value="biomass">Biomass</option>
              <option value="windoffshore">Wind Offshore</option>
              <option value="windonshore">Wind Onshore</option>
              <option value="hydroelectric">Hydroelectric</option>
              <option value="naturalgas">Natural Gas</option>
              <option value="blackcoal">Black Coal</option>
              <option value="photovoltaik">Photovoltaik</option>
              <option value="otherconventional">Other Conventional</option>
              <option value="otherrenewable">Other Renewable</option>
            </select>
          </div>
          <canvas id="myChart2" width="400" height="85"></canvas>
        </div>

        <h2>Hydrogen Eco Simulation</h2>

        <h3>Select Use Case: </h3>
        <div class="usecase-container">
          <select id="use-case" class="use-case">
            <option value="offgrid">Off-Grid Sustainable Home</option>
            <option value="microgrid">Microgrid for a Remote Village</option>
            <option value="evcharge">EV Charging Station with Renewable Energy</option>
            <option value="industrial">Industrial Hydrogen Production Plant</option>
          </select>
        </div>
        <div id="bullet-points-container"></div>
        <div class="eco-system-container">
          <div class="eco-item" id="battery">
            <h3>Battery</h3>
            <p>Battery Level: <span id="battery-level">0 </span></p>
            <label for="battery-efficiency">Battery Efficiency:</label>
            <input type="range" id="battery-efficiency" step="1" min="1" max="100" />
            <span id="battery-efficiency-value">100</span>
            <label for="battery-capacity">Battery Capacity:</label>
            <input type="range" id="battery-capacity" step="1" min="1" max="10000" />
            <span id="battery-capacity-value">10 kWh</span>
          </div>

          <div class="eco-item" id="electrolyzer">
            <h3>Electrolyzer</h3>
            <p>Hydrogen Level: <span id="hydrogen-level">0</span></p>
            <label for="electrolyzer-efficiency">Electrolyzer Efficiency:</label>
            <input type="range" id="electrolyzer-efficiency" step="1" min="1" max="100" />
            <span id="electrolyzer-efficiency-value">1</span>
            <label for="electrolyzer-power">Electrolyzer Power:</label>
            <input type="range" id="electrolyzer-power" step="1" min="100" max="1000000" />
            <span id="electrolyzer-power-value">200</span>
            <label for="electrolyzer-capacity">Electrolyzer Capacity:</label>
            <input type="range" id="electrolyzer-capacity" step="1" min="100" max="10000" />
            <span id="electrolyzer-capacity-value">1000</span>
          </div>

          <div class="eco-item" id="fuelcell">
            <h3>Fuel Cell</h3>
            <label for="fuelcell-efficiency">Fuelcell Efficiency:</label>
            <input type="range" id="fuelcell-efficiency" step="1" min="1" max="100" />
            <span id="fuelcell-efficiency-value">100</span>
            <label for="fuelcell-power">Fuelcell Power:</label>
            <input type="range" id="fuelcell-power" step="1" min="100" max="1000000" />
            <span id="fuelcell-power-value">200</span>
          </div>

          <div class="eco-item" id="photovoltaik">
            <h3>Photovoltaik</h3>
            <label for="PV-efficiency">PV Efficiency:</label>
            <input type="range" id="PV-efficiency" step="1" min="1" max="100" />
            <span id="PV-efficiency-value">20</span>
            <label for="PV-power">Photovoltaik Power:</label>
            <input type="range" id="PV-power" step="1" min="100" max="1000000" />
            <span id="PV-power-value">200</span>
            <label for="city-select">Select Location:</label>
            <select id="city-select">
              <option value="Frankfurt">Frankfurt</option>
              <option value="Sydney">Sydney</option>
              <option value="New York">New York</option>
              <option value="Madrid">Madrid</option>
              <option value="Tokyo">Tokyo</option>
            </select>
            <p>Current Location: <span id="location"></span></p>
            <p>PV Status: <span id="sun"></span></p>
          </div>
        </div>

        <div id="button-container">
          <button id="sell-button" class="button sell">Sell 1kWh</button>
          <button id="buy-button" class="button buy">Buy 1kWh</button>
          <button id="convert-to-hydrogen" class="start">Start Electrolyzer</button>
          <button id="convert-to-hydrogen-stop" class="button">Stop Electrolyzer</button>
          <button id="convert-to-electricity" class="start">Start Fuelcell</button>
          <button id="convert-to-electricity-stop" class="button">Stop Fuelcell</button>
          <p>Money in Account: <span id="money"></span></p>
          <label for="speed-factor">Speed Factor:</label>
          <input type="range" id="speed-factor" step="1" min="1" max="10" />
          <span id="speed-factor-value">1x</span>
          <button id="reset" class="button regular">Reset Simulation</button>
        </div>

        <div class="flowchart">
          <div class="flow-item">
            <img src="https://yourcdn.com/widgets/icons/photovoltaik.webp" alt="Photovoltaik" />
            <p>Photovoltaik</p>
          </div>
          <div id="pv-charging-arrow">
            <img id="pv-static-arrow" src="https://yourcdn.com/widgets/icons/arrow.webp" alt="Charging Arrow" />
            <img
              id="pv-animated-arrow"
              src="https://yourcdn.com/widgets/icons/arrowanim.gif"
              alt="Charging Animation"
              style="display: none"
            />
          </div>
          <div class="flow-item">
            <img src="https://yourcdn.com/widgets/icons/battery.webp" alt="Battery" />
            <p>Battery</p>
          </div>
          <div id="electrolyzer-charging-arrow">
            <img id="electrolyzer-static-arrow" src="https://yourcdn.com/widgets/icons/arrow.webp" alt="Charging Arrow" />
            <img
              id="electrolyzer-animated-arrow"
              src="https://yourcdn.com/widgets/icons/arrowanim.gif"
              alt="Charging Animation"
              style="display: none"
            />
          </div>
          <div class="flow-item">
            <img src="https://yourcdn.com/widgets/icons/electrolyzer.webp" alt="Electrolyzer" />
            <p>Electrolyzer</p>
          </div>
          <div id="hydrogen-charging-arrow">
            <img id="hydrogen-static-arrow" src="https://yourcdn.com/widgets/icons/arrow.webp" alt="Charging Arrow" />
            <img
              id="hydrogen-animated-arrow"
              src="https://yourcdn.com/widgets/icons/arrowanim.gif"
              alt="Charging Animation"
              style="display: none"
            />
          </div>
          <div class="flow-item">
            <img src="https://yourcdn.com/widgets/icons/fuelcell.webp" alt="Fuelcell" />
            <p>Fuelcell</p>
          </div>
          <div id="fuelcell-charging-arrow">
            <img id="fuelcell-static-arrow" src="https://yourcdn.com/widgets/icons/arrow.webp" alt="Charging Arrow" />
            <img
              id="fuelcell-animated-arrow"
              src="https://yourcdn.com/widgets/icons/arrowanim.gif"
              alt="Charging Animation"
              style="display: none"
            />
          </div>
          <div class="flow-item">
            <img src="https://yourcdn.com/widgets/icons/electricity.webp" alt="Electricity" />
            <p>Electricity</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
;