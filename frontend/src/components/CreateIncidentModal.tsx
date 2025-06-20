import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Client, IncidentType, FormField, CreateIncidentData } from '../types'
import { incidentsService } from '../services/incidents'
import { toast } from 'react-hot-toast'

interface CreateIncidentModalProps {
  client: Client
  isOpen: boolean
  onClose: () => void
  onIncidentCreated: () => void
}

interface FormData {
  incidentTypeId: string
  title: string
  description: string
  priority: number
  [key: string]: any
}

export default function CreateIncidentModal({ 
  client, 
  isOpen, 
  onClose, 
  onIncidentCreated 
}: CreateIncidentModalProps) {
  const [selectedIncidentType, setSelectedIncidentType] = useState<IncidentType | null>(null)
  
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      priority: 1
    }
  })

  const incidentTypeId = watch('incidentTypeId')

  // Set selected incident type when form value changes
  useEffect(() => {
    if (incidentTypeId && client.incidentTypes) {
      const incidentType = client.incidentTypes.find(type => type.id === incidentTypeId)
      setSelectedIncidentType(incidentType || null)
    }
  }, [incidentTypeId, client.incidentTypes])

  const createIncidentMutation = useMutation({
    mutationFn: (data: CreateIncidentData) => incidentsService.createIncident(data),
    onSuccess: () => {
      toast.success('Incident created successfully!')
      reset()
      onIncidentCreated()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create incident')
    }
  })

  const onSubmit = (formData: FormData) => {
    if (!selectedIncidentType) return

    // Extract dynamic fields
    const dynamicData: Record<string, any> = {}
    selectedIncidentType.fields.forEach((field: FormField) => {
      if (formData[field.name] !== undefined) {
        dynamicData[field.name] = formData[field.name]
      }
    })

    const incidentData: CreateIncidentData = {
      clientId: client.id,
      incidentTypeId: formData.incidentTypeId,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      data: dynamicData
    }

    createIncidentMutation.mutate(incidentData)
  }

  const renderFormField = (field: FormField) => {
    const fieldName = field.name
    const isRequired = field.required

    switch (field.type) {
      case 'text':
        return (
          <input
            key={fieldName}
            {...register(fieldName, { required: isRequired ? `${field.label} is required` : false })}
            type="text"
            className="input"
            placeholder={field.label}
          />
        )
      case 'textarea':
        return (
          <textarea
            key={fieldName}
            {...register(fieldName, { required: isRequired ? `${field.label} is required` : false })}
            className="textarea"
            placeholder={field.label}
            rows={3}
          />
        )
      case 'number':
        return (
          <input
            key={fieldName}
            {...register(fieldName, { 
              required: isRequired ? `${field.label} is required` : false,
              valueAsNumber: true
            })}
            type="number"
            className="input"
            placeholder={field.label}
          />
        )
      case 'select':
        return (
          <select
            key={fieldName}
            {...register(fieldName, { required: isRequired ? `${field.label} is required` : false })}
            className="select"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <label key={fieldName} className="flex items-center space-x-2">
            <input
              {...register(fieldName)}
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </label>
        )
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Create New Incident - {client.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Incident Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incident Type *
              </label>
              <select
                {...register('incidentTypeId', { required: 'Incident type is required' })}
                className="select"
              >
                <option value="">Select incident type</option>
                {client.incidentTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.incidentTypeId && (
                <p className="mt-1 text-sm text-red-600">{errors.incidentTypeId.message}</p>
              )}
            </div>

            {/* Basic Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="input"
                placeholder="Brief description of the incident"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                className="textarea"
                placeholder="Detailed description of the incident"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                {...register('priority', { 
                  required: 'Priority is required',
                  valueAsNumber: true
                })}
                className="select"
              >
                <option value={1}>Low (1)</option>
                <option value={2}>Normal (2)</option>
                <option value={3}>High (3)</option>
                <option value={4}>Urgent (4)</option>
                <option value={5}>Critical (5)</option>
              </select>
            </div>

            {/* Dynamic Fields */}
            {selectedIncidentType && selectedIncidentType.fields.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedIncidentType.name} Details
                </h3>
                <div className="space-y-4">
                  {selectedIncidentType.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {field.required && '*'}
                      </label>
                      {renderFormField(field)}                      {errors[field.name] && (
                        <p className="mt-1 text-sm text-red-600">
                          {String(errors[field.name]?.message || 'This field is required')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createIncidentMutation.isPending}
                className="btn-primary"
              >
                {createIncidentMutation.isPending ? 'Creating...' : 'Create Incident'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
