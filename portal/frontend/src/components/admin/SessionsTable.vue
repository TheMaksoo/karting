<template>
  <div class="sessions-table">
    <div class="table-header">
      <h3>Sessions ({{ total }})</h3>
      <button @click="$emit('refresh')" class="btn-refresh">🔄 Refresh</button>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>Track</label>
          <select v-model="filters.track_id" @change="emitFilters">
            <option value="">All Tracks</option>
            <option v-for="track in tracks" :key="track.id" :value="track.id">{{ track.name }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Session Type</label>
          <select v-model="filters.session_type" @change="emitFilters">
            <option value="">All Types</option>
            <option value="Practice">Practice</option>
            <option value="Race">Race</option>
            <option value="Qualifying">Qualifying</option>
            <option value="Heat">Heat</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Date From</label>
          <input type="date" v-model="filters.date_from" @change="emitFilters" />
        </div>

        <div class="filter-group">
          <label>Date To</label>
          <input type="date" v-model="filters.date_to" @change="emitFilters" />
        </div>

        <button @click="clearFilters" class="btn-clear-filters">✕ Clear</button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading sessions...</p>
    </div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="!items.length" class="empty-state">
      <p>📭 No sessions found</p>
    </div>

    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Time</th>
            <th>Track</th>
            <th>Type</th>
            <th>Heat #</th>
            <th>Weather</th>
            <th>Source</th>
            <th>Heat Price</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in items" :key="session.id" :class="{ editing: editingId === session.id }">
            <td class="mono">{{ session.id }}</td>
            <td>
              <input v-if="editingId === session.id" v-model="editForm.session_date" type="date" />
              <span v-else>{{ formatDate(session.session_date) }}</span>
            </td>
            <td>
              <input v-if="editingId === session.id" v-model="editForm.session_time" type="time" />
              <span v-else>{{ session.session_time || '-' }}</span>
            </td>
            <td>
              <select v-if="editingId === session.id" v-model="editForm.track_id">
                <option v-for="track in tracks" :key="track.id" :value="track.id">{{ track.name }}</option>
              </select>
              <span v-else>{{ session.track?.name || 'N/A' }}</span>
            </td>
            <td>
              <select v-if="editingId === session.id" v-model="editForm.session_type">
                <option value="Practice">Practice</option>
                <option value="Race">Race</option>
                <option value="Qualifying">Qualifying</option>
                <option value="Heat">Heat</option>
              </select>
              <span v-else>{{ session.session_type }}</span>
            </td>
            <td>
              <input v-if="editingId === session.id" v-model.number="editForm.heat" type="number" min="1" />
              <span v-else>{{ session.heat }}</span>
            </td>
            <td>
              <input v-if="editingId === session.id" v-model="editForm.weather" type="text" />
              <span v-else>{{ session.weather || '-' }}</span>
            </td>
            <td>
              <input v-if="editingId === session.id" v-model="editForm.source" type="text" />
              <span v-else>{{ session.source || '-' }}</span>
            </td>
            <td>
              <input v-if="editingId === session.id" v-model.number="editForm.heat_price" type="number" step="0.01" />
              <span v-else>€{{ formatCost(session.heat_price) }}</span>
            </td>
            <td>
              <input v-if="editingId === session.id" v-model="editForm.notes" type="text" />
              <span v-else>{{ session.notes || '-' }}</span>
            </td>
            <td class="actions">
              <button v-if="editingId === session.id" @click="saveEdit" class="btn-icon btn-save">✓</button>
              <button v-if="editingId === session.id" @click="cancelEdit" class="btn-icon btn-cancel">✗</button>
              <button v-else @click="startEdit(session)" class="btn-icon btn-edit">✎</button>
              <button @click="deleteItem(session.id)" class="btn-icon btn-delete">🗑</button>
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

interface Session {
  id: number
  track_id: number
  session_date: string
  session_time: string | null
  session_type: string
  heat: number
  weather: string | null
  source: string | null
  heat_price: number | null
  notes: string | null
  track?: Track
}

interface SessionFilters {
  track_id?: string
  session_type?: string
  date_from?: string
  date_to?: string
}

interface SessionEditForm {
  track_id: number
  session_date: string
  session_time: string | null
  session_type: string
  heat: number
  weather: string | null
  source: string | null
  heat_price: number | null
  notes: string | null
}

import type { Track } from '@/services/api'
import { getErrorMessage } from '@/composables/useErrorHandler'

const props = defineProps<{
  items: Session[]
  loading: boolean
  error: string
  currentPage: number
  totalPages: number
  total: number
  tracks: Track[]
}>()

// Expose props for template usage
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _props = props

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'page-change', page: number): void
  (e: 'filter-change', filters: SessionFilters): void
}>()

const editingId = ref<number | null>(null)
const editForm = reactive<SessionEditForm>({
  track_id: 0,
  session_date: '',
  session_time: null,
  session_type: '',
  heat: 0,
  weather: null,
  source: null,
  heat_price: null,
  notes: null
})

const filters = reactive({
  track_id: '',
  session_type: '',
  date_from: '',
  date_to: '',
})

const emitFilters = () => {
  const activeFilters: SessionFilters = {}
  if (filters.track_id) activeFilters.track_id = filters.track_id
  if (filters.session_type) activeFilters.session_type = filters.session_type
  if (filters.date_from) activeFilters.date_from = filters.date_from
  if (filters.date_to) activeFilters.date_to = filters.date_to
  
  emit('filter-change', activeFilters)
}

const clearFilters = () => {
  filters.track_id = ''
  filters.session_type = ''
  filters.date_from = ''
  filters.date_to = ''
  emitFilters()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatCost = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '0.00'
  const num = typeof price === 'string' ? parseFloat(price) : price
  return isNaN(num) ? '0.00' : num.toFixed(2)
}

const startEdit = (session: Session) => {
  editingId.value = session.id
  Object.assign(editForm, {
    track_id: session.track_id,
    session_date: session.session_date,
    session_time: session.session_time,
    session_type: session.session_type,
    heat: session.heat,
    weather: session.weather,
    source: session.source,
    heat_price: session.heat_price,
    notes: session.notes,
  })
}

const saveEdit = async () => {
  if (!editingId.value) return
  
  try {
    await apiService.updateSession(editingId.value, editForm)
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
  if (!confirm('Delete this session and all its laps?')) return
  
  try {
    await apiService.deleteSession(id)
    emit('refresh')
  } catch (error: unknown) {
    alert('Failed to delete: ' + getErrorMessage(error))
  }
}
</script>

<style scoped lang="scss">
.sessions-table {
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
    }
  }

  .filters-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: var(--border-radius);

    .filter-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filter-group {
      flex: 1;
      min-width: 150px;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      input, select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-color);
        color: var(--text-color);
        font-size: 0.9rem;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }
    }

    .btn-clear-filters {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--border-radius);
      background: var(--bg-color);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      cursor: pointer;
      white-space: nowrap;

      &:hover {
        background: var(--error-color);
        color: white;
        border-color: var(--error-color);
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

          &:hover:not(.editing) {
            background: var(--bg-secondary);
          }

          td {
            padding: 0.75rem;

            input, select {
              width: 100%;
              min-width: 100px;
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

            &.mono {
              font-family: 'Courier New', monospace;
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
