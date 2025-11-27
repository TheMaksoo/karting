<template>
  <div class="chart-filters">
    <div v-if="showDriverFilter" class="filter-group">
      <label for="driver-select">Driver</label>
      <select 
        id="driver-select" 
        :value="selectedDriver"
        @change="handleDriverChange"
        class="filter-select"
      >
        <option value="">All Drivers</option>
        <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
          {{ driver.name }}
        </option>
      </select>
    </div>

    <div v-if="showTrackFilter" class="filter-group">
      <label for="track-select">Track</label>
      <select 
        id="track-select"
        :value="selectedTrack"
        @change="handleTrackChange"
        class="filter-select"
      >
        <option value="">All Tracks</option>
        <option v-for="track in tracks" :key="track.id" :value="track.id">
          {{ track.name }}
        </option>
      </select>
    </div>

    <div v-if="showDateFilter" class="filter-group">
      <label for="date-from">Date From</label>
      <input 
        id="date-from"
        type="date"
        :value="dateFrom"
        @input="handleDateFromChange"
        class="filter-input"
      />
    </div>

    <div v-if="showDateFilter" class="filter-group">
      <label for="date-to">Date To</label>
      <input 
        id="date-to"
        type="date"
        :value="dateTo"
        @input="handleDateToChange"
        class="filter-input"
      />
    </div>

    <div v-if="showResetButton" class="filter-group">
      <label>&nbsp;</label>
      <button @click="emit('reset')" class="filter-reset">
        Reset Filters
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Driver {
  id: number
  name: string
}

interface Track {
  id: number
  name: string
}

interface Props {
  drivers?: Driver[]
  tracks?: Track[]
  selectedDriver?: string
  selectedTrack?: string
  dateFrom?: string
  dateTo?: string
  showDriverFilter?: boolean
  showTrackFilter?: boolean
  showDateFilter?: boolean
  showResetButton?: boolean
}

withDefaults(defineProps<Props>(), {
  drivers: () => [],
  tracks: () => [],
  selectedDriver: '',
  selectedTrack: '',
  dateFrom: '',
  dateTo: '',
  showDriverFilter: true,
  showTrackFilter: true,
  showDateFilter: true,
  showResetButton: true,
})

const emit = defineEmits<{
  'update:selectedDriver': [value: string]
  'update:selectedTrack': [value: string]
  'update:dateFrom': [value: string]
  'update:dateTo': [value: string]
  'reset': []
}>()

const handleDriverChange = (event: Event) => {
  emit('update:selectedDriver', (event.target as HTMLSelectElement).value)
}

const handleTrackChange = (event: Event) => {
  emit('update:selectedTrack', (event.target as HTMLSelectElement).value)
}

const handleDateFromChange = (event: Event) => {
  emit('update:dateFrom', (event.target as HTMLInputElement).value)
}

const handleDateToChange = (event: Event) => {
  emit('update:dateTo', (event.target as HTMLInputElement).value)
}
</script>

<style scoped>
.chart-filters {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
  flex: 1;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.filter-select,
.filter-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;
  background: white;
  transition: border-color 0.2s;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-reset {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-reset:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

@media (max-width: 768px) {
  .chart-filters {
    flex-direction: column;
  }
  
  .filter-group {
    min-width: 100%;
  }
}
</style>
