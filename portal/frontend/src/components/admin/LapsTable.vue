<template>
  <div class="laps-table">
    <div class="table-header">
      <h3>Laps ({{ total }})</h3>
      <div class="header-actions">
        <select v-model="localDriverFilter" @change="$emit('filter-change', { driver: localDriverFilter, track: localTrackFilter })" class="filter-select">
          <option value="">All Drivers</option>
          <option v-for="driver in drivers" :key="driver.id" :value="driver.id">{{ driver.name }}</option>
        </select>
        <select v-model="localTrackFilter" @change="$emit('filter-change', { driver: localDriverFilter, track: localTrackFilter })" class="filter-select">
          <option value="">All Tracks</option>
          <option v-for="track in tracks" :key="track.id" :value="track.id">{{ track.name }}</option>
        </select>
        <button @click="$emit('refresh')" class="btn-refresh">🔄</button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading laps...</p>
    </div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="!items.length" class="empty-state">
      <p>📭 No laps found</p>
    </div>

    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Session</th>
            <th>Driver</th>
            <th>Lap #</th>
            <th>Lap Time</th>
            <th>Position</th>
            <th>S1</th>
            <th>S2</th>
            <th>S3</th>
            <th>Best</th>
            <th>Gap</th>
            <th>Interval</th>
            <th>Avg Speed</th>
            <th>Kart #</th>
            <th>Tyre</th>
            <th>Cost</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lap in items" :key="lap.id" :class="{ editing: editingId === lap.id, best: lap.is_best_lap }">
            <td class="mono">{{ lap.id }}</td>
            <td class="mono">{{ lap.karting_session_id }}</td>
            <td>
              <select v-if="editingId === lap.id" v-model="editForm.driver_id">
                <option v-for="driver in drivers" :key="driver.id" :value="driver.id">{{ driver.name }}</option>
              </select>
              <span v-else>{{ lap.driver?.name || 'N/A' }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model.number="editForm.lap_number" type="number" min="1" />
              <span v-else>{{ lap.lap_number }}</span>
            </td>
            <td class="highlight">
              <input v-if="editingId === lap.id" v-model.number="editForm.lap_time" type="number" step="0.001" />
              <span v-else>{{ formatTime(lap.lap_time) }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model.number="editForm.position" type="number" min="1" />
              <span v-else>{{ lap.position || '-' }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model.number="editForm.sector1" type="number" step="0.001" />
              <span v-else>{{ formatTime(lap.sector1) }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model.number="editForm.sector2" type="number" step="0.001" />
              <span v-else>{{ formatTime(lap.sector2) }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model.number="editForm.sector3" type="number" step="0.001" />
              <span v-else>{{ formatTime(lap.sector3) }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model="editForm.is_best_lap" type="checkbox" />
              <span v-else>{{ lap.is_best_lap ? '⭐' : '' }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model.number="editForm.gap_to_best_lap" type="number" step="0.001" />
              <span v-else>{{ formatTime(lap.gap_to_best_lap) }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model.number="editForm.interval" type="number" step="0.001" />
              <span v-else>{{ formatTime(lap.interval) }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model.number="editForm.avg_speed" type="number" step="0.01" />
              <span v-else>{{ formatSpeed(lap.avg_speed) }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model="editForm.kart_number" type="text" />
              <span v-else>{{ lap.kart_number || '-' }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model="editForm.tyre" type="text" />
              <span v-else>{{ lap.tyre || '-' }}</span>
            </td>
            <td>
              <input v-if="editingId === lap.id" v-model.number="editForm.cost_per_lap" type="number" step="0.01" />
              <span v-else>{{ formatCost(lap.cost_per_lap) }}</span>
            </td>
            <td class="actions">
              <button v-if="editingId === lap.id" @click="saveEdit" class="btn-icon btn-save">✓</button>
              <button v-if="editingId === lap.id" @click="cancelEdit" class="btn-icon btn-cancel">✗</button>
              <button v-else @click="startEdit(lap)" class="btn-icon btn-edit">✎</button>
              <button @click="deleteItem(lap.id)" class="btn-icon btn-delete">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="totalPages > 1">
        <button @click="$emit('page-change', currentPage - 1)" :disabled="currentPage === 1">Previous</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="$emit('page-change', currentPage + 1)" :disabled="currentPage === totalPages">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import apiService from '@/services/api'
import type { Lap, Driver, Track } from '@/services/api'
import { getErrorMessage } from '@/composables/useErrorHandler'

interface LapEditForm {
  id: number
  lap_number: number
  lap_time: number | null
  sector_1_time: number | null
  sector_2_time: number | null
  sector_3_time: number | null
  position: number | null
}

const props = defineProps<{
  items: Lap[]
  loading: boolean
  error: string
  currentPage: number
  totalPages: number
  total: number
  drivers: Driver[]
  tracks: Track[]
  driverFilter: string
  trackFilter: string
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'page-change', page: number): void
  (e: 'filter-change', filters: { driver: string, track: string }): void
}>()

const localDriverFilter = ref(props.driverFilter)
const localTrackFilter = ref(props.trackFilter)
const editingId = ref<number | null>(null)
const editForm = reactive<LapEditForm>({
  id: 0,
  lap_number: 0,
  lap_time: null,
  sector_1_time: null,
  sector_2_time: null,
  sector_3_time: null,
  position: null
})

const formatTime = (time: string | number | null | undefined): string => {
  if (time === null || time === undefined || time === '' || time === 0) return '-'
  const num = typeof time === 'string' ? parseFloat(time) : time
  if (isNaN(num) || num === 0) return '-'
  return num.toFixed(3) + 's'
}

const formatSpeed = (speed: string | number | null | undefined): string => {
  if (speed === null || speed === undefined || speed === '') return '-'
  const num = typeof speed === 'string' ? parseFloat(speed) : speed
  if (isNaN(num)) return '-'
  return num.toFixed(1) + ' km/h'
}

const formatCost = (cost: string | number | null | undefined): string => {
  if (cost === null || cost === undefined || cost === '') return '-'
  const num = typeof cost === 'string' ? parseFloat(cost) : cost
  if (isNaN(num)) return '-'
  return '€' + num.toFixed(2)
}

const startEdit = (lap: Lap) => {
  editingId.value = lap.id
  Object.assign(editForm, { ...lap })
}

const saveEdit = async () => {
  if (!editingId.value) return
  
  try {
    await apiService.updateLap(editingId.value, editForm)
    editingId.value = null
    emit('refresh')
  } catch (error: unknown) {
    alert('Failed to save: ' + getErrorMessage(error))
  }
}

const cancelEdit = () => {
  editingId.value = null
}

const deleteItem = async (id: number) => {
  if (!confirm('Delete this lap?')) return
  
  try {
    await apiService.deleteLap(id)
    emit('refresh')
  } catch (error: unknown) {
    alert('Failed to delete: ' + getErrorMessage(error))
  }
}
</script>

<style scoped lang="scss">
.laps-table {
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;

      .filter-select {
        padding: 0.5rem;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        background: var(--card-bg);
        color: var(--text-color);

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }
    }
  }

  .table-wrapper {
    overflow-x: auto;

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card-bg);

      thead {
        background: var(--bg-secondary);
        
        th {
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid var(--border-color);
          white-space: nowrap;
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid var(--border-color);

          &.editing {
            background: rgba(var(--primary-color-rgb), 0.05);
          }

          &.best {
            background: rgba(255, 215, 0, 0.1);
          }

          &:hover:not(.editing) {
            background: var(--bg-secondary);
          }

          td {
            padding: 0.75rem;

            input, select {
              width: 100%;
              min-width: 80px;
              padding: 0.5rem;
              border: 2px solid var(--border-color);
              border-radius: 4px;
              background: var(--bg-color);
              color: var(--text-color);

              &:focus {
                outline: none;
                border-color: var(--primary-color);
              }
            }

            input[type="checkbox"] {
              width: auto;
              min-width: auto;
            }

            &.mono {
              font-family: 'Courier New', monospace;
            }

            &.highlight {
              font-weight: 600;
              color: var(--primary-color);
            }

            &.actions {
              display: flex;
              gap: 0.5rem;
              white-space: nowrap;
            }
          }
        }
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;

    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--border-radius);
      background: var(--primary-color);
      color: white;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background: var(--primary-hover);
      }
    }
  }
}

.btn-icon {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &.btn-save {
    background: var(--success-color);
    color: white;
  }

  &.btn-cancel {
    background: var(--bg-secondary);
    color: var(--text-color);
  }

  &.btn-edit {
    background: var(--primary-color);
    color: white;
  }

  &.btn-delete {
    background: var(--error-color);
    color: white;
  }

  &:hover {
    opacity: 0.9;
  }
}

.btn-refresh {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  background: var(--primary-color);
  color: white;
  cursor: pointer;

  &:hover {
    background: var(--primary-hover);
  }
}

.loading, .error, .empty-state {
  padding: 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: var(--error-color);
  background: var(--error-bg);
  border-radius: var(--border-radius);
}
</style>
