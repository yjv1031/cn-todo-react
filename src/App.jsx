import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN
const API_BASE_URL = `${API_ORIGIN}/vercel-todo/todo`

const parseError = async (response) => {
  try {
    const body = await response.json()
    return body.message || body.code || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

function App() {
  const [todos, setTodos] = useState([])
  const [newContent, setNewContent] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const sortedTodos = useMemo(
    () =>
      [...todos].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [todos],
  )

  const fetchTodos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(API_BASE_URL)
      if (!response.ok) {
        throw new Error(await parseError(response))
      }
      const data = await response.json()
      setTodos(Array.isArray(data) ? data : [])
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load todo list.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const handleCreate = async (event) => {
    event.preventDefault()
    const content = newContent.trim()
    if (!content) return

    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        throw new Error(await parseError(response))
      }
      setNewContent('')
      await fetchTodos()
    } catch (createError) {
      setError(createError.message || 'Failed to create todo.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (todo) => {
    setEditingId(todo.id)
    setEditingContent(todo.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
  }

  const handleUpdate = async (id) => {
    const content = editingContent.trim()
    if (!content) return

    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        throw new Error(await parseError(response))
      }
      cancelEdit()
      await fetchTodos()
    } catch (updateError) {
      setError(updateError.message || 'Failed to update todo.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(await parseError(response))
      }
      if (editingId === id) {
        cancelEdit()
      }
      await fetchTodos()
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete todo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app">
      <section className="card">
        <header className="heading">
          <h1>Todo Manager</h1>
          <p>Connected to /vercel-todo API</p>
        </header>

        <form className="create-form" onSubmit={handleCreate}>
          <input
            value={newContent}
            onChange={(event) => setNewContent(event.target.value)}
            placeholder="Enter a new todo"
            maxLength={200}
            disabled={submitting}
          />
          <button type="submit" disabled={submitting || !newContent.trim()}>
            Add
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {loading ? (
          <p className="status">Loading...</p>
        ) : sortedTodos.length === 0 ? (
          <p className="status">No todos yet.</p>
        ) : (
          <ul className="todo-list">
            {sortedTodos.map((todo) => {
              const isEditing = editingId === todo.id
              return (
                <li key={todo.id} className="todo-item">
                  <div className="todo-main">
                    {isEditing ? (
                      <input
                        value={editingContent}
                        onChange={(event) => setEditingContent(event.target.value)}
                        maxLength={200}
                        disabled={submitting}
                      />
                    ) : (
                      <p className="content">{todo.content}</p>
                    )}
                    <p className="meta">
                      ID: {todo.id} | Created: {new Date(todo.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdate(todo.id)}
                          disabled={submitting || !editingContent.trim()}
                        >
                          Save
                        </button>
                        <button type="button" onClick={cancelEdit} disabled={submitting}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => startEdit(todo)} disabled={submitting}>
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(todo.id)} disabled={submitting}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
