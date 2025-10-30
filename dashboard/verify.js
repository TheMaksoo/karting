// Dashboard Verification Script
// This script checks that all components are working correctly

console.log('🔍 Starting Dashboard Verification...');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for CSV data to load
    setTimeout(verifyDashboard, 2000);
});

function verifyDashboard() {
    console.log('📊 Verifying Dashboard Components...');
    
    // 1. Check if data is loaded
    if (typeof kartingData !== 'undefined' && kartingData.length > 0) {
        console.log('✅ Data loaded successfully:', kartingData.length, 'entries');
        
        // 2. Check tracks
        const tracks = [...new Set(kartingData.map(row => row.Track))].sort();
        console.log('🏁 Available tracks:', tracks);
        
        // 3. Check if lot66 is included
        const hasLot66 = tracks.includes('Lot66');
        console.log('🎯 Lot66 track included:', hasLot66 ? '✅' : '❌');
        
        // 4. Check drivers
        const drivers = [...new Set(kartingData.map(row => row.Driver))].sort();
        console.log('🏎️ Available drivers:', drivers.length, 'drivers');
        
        // 5. Check KPI tiles
        const kpiTiles = document.querySelectorAll('.kpi-tile');
        console.log('📊 KPI tiles found:', kpiTiles.length, '(should be 9)');
        
        // Check specific KPI elements
        const kpiElements = [
            'totalEntries', 'dataPoints', 'totalHeats',
            'avgLapsPerSession', 'avgLapOverall', 'sessionsWon',
            'totalCost', 'totalTracks', 'consistencyMetric'
        ];
        const missingElements = kpiElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.log('❌ Missing KPI elements:', missingElements);
        } else {
            console.log('✅ All KPI elements present');
        }
        
        // 6. Check track filter dropdown
        const trackFilter = document.getElementById('trackFilter');
        if (trackFilter) {
            const trackOptions = Array.from(trackFilter.options).map(opt => opt.value).filter(val => val);
            console.log('🔽 Track filter options:', trackOptions);
            const lot66InFilter = trackOptions.includes('Lot66');
            console.log('🎯 Lot66 in track filter:', lot66InFilter ? '✅' : '❌');
        }
        
        // 7. Check if charts are initialized
        if (typeof charts !== 'undefined') {
            console.log('📈 Charts object exists:', Object.keys(charts).length, 'charts initialized');
        }
        
        // 8. Check data statistics
        const totalEntries = kartingData.length;
        const dataColumns = 26;
        const totalDataPoints = totalEntries * dataColumns;
        const uniqueTracks = new Set(kartingData.map(row => row.Track)).size;
        
        console.log('📈 Data Statistics:');
        console.log('   - Total entries:', totalEntries);
        console.log('   - Data columns:', dataColumns);
        console.log('   - Total data points:', totalDataPoints);
        console.log('   - Unique tracks:', uniqueTracks);
        
        // 9. Verify lot66 data structure
        const lot66Data = kartingData.filter(row => row.Track === 'Lot66');
        if (lot66Data.length > 0) {
            console.log('✅ Lot66 data verification:');
            console.log('   - Lot66 entries:', lot66Data.length);
            console.log('   - Track ID:', lot66Data[0].TrackID);
            console.log('   - Drivers on Lot66:', [...new Set(lot66Data.map(row => row.Driver))]);
            console.log('   - Sample lap time:', lot66Data[0].LapTime);
        } else {
            console.log('❌ No Lot66 data found!');
        }
        
        console.log('🎉 Dashboard verification complete!');
        
    } else {
        console.log('❌ Data not loaded or empty!');
    }
}