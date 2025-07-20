import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Chip
} from '@mui/material';
import {
  Code,
  Visibility,
  Edit,
  ContentCopy,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * JSON Schema data interface
 */
export interface JSONSchema {
  $schema?: string;
  type?: string;
  title?: string;
  description?: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

/**
 * Props for the JSONSchemaViewer component
 */
export interface JSONSchemaViewerProps {
  /** JSON schema to display */
  schema: JSONSchema;
  /** Sample data that conforms to the schema */
  sampleData?: any;
  /** Whether the viewer is in edit mode */
  editable?: boolean;
  /** Callback when schema is edited */
  onSchemaChange?: (schema: JSONSchema) => void;
  /** Callback when sample data is edited */
  onSampleDataChange?: (data: any) => void;
  /** Maximum height of the viewer */
  maxHeight?: number;
  /** Whether to show validation errors */
  showValidation?: boolean;
}

/**
 * Tab panel component for organizing content
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`schema-tabpanel-${index}`}
      aria-labelledby={`schema-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

/**
 * Simple JSON editor component
 */
interface JSONEditorProps {
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
  maxHeight?: number;
}

const JSONEditor: React.FC<JSONEditorProps> = ({ 
  value, 
  onChange, 
  readOnly = false,
  maxHeight = 400 
}) => {
  const [jsonString, setJsonString] = useState(() => 
    JSON.stringify(value, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setJsonString(newValue);

    try {
      const parsed = JSON.parse(newValue);
      setError(null);
      onChange(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          JSON Editor
        </Typography>
        <IconButton size="small" onClick={handleCopy} title="Copy to clipboard">
          <ContentCopy fontSize="small" />
        </IconButton>
      </Box>
      
      <Paper variant="outlined" sx={{ position: 'relative' }}>
        <textarea
          value={jsonString}
          onChange={handleChange}
          readOnly={readOnly}
          style={{
            width: '100%',
            minHeight: 200,
            maxHeight,
            padding: 16,
            border: 'none',
            outline: 'none',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            resize: 'vertical',
            backgroundColor: 'transparent'
          }}
        />
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}
    </Box>
  );
};

/**
 * Schema property renderer
 */
const SchemaProperty: React.FC<{ 
  name: string; 
  property: any; 
  required?: boolean;
  level?: number;
}> = ({ name, property, required = false, level = 0 }) => {
  const indent = level * 16;

  return (
    <Box sx={{ ml: `${indent}px`, mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        {required && (
          <Chip label="required" size="small" color="error" variant="outlined" />
        )}
        <Chip 
          label={property.type || 'any'} 
          size="small" 
          variant="outlined"
          sx={{ ml: 'auto' }}
        />
      </Box>
      
      {property.description && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {property.description}
        </Typography>
      )}

      {property.properties && (
        <Box sx={{ ml: 2, mt: 1 }}>
          {Object.entries(property.properties).map(([propName, propDef]: [string, any]) => (
            <SchemaProperty
              key={propName}
              name={propName}
              property={propDef}
              required={property.required?.includes(propName)}
              level={level + 1}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

/**
 * JSONSchemaViewer component for viewing and editing JSON schemas
 * 
 * @example
 * ```tsx
 * <JSONSchemaViewer
 *   schema={connectorSchema}
 *   sampleData={sampleResponse}
 *   editable
 *   onSchemaChange={handleSchemaChange}
 * />
 * ```
 */
export const JSONSchemaViewer: React.FC<JSONSchemaViewerProps> = ({
  schema,
  sampleData,
  editable = false,
  onSchemaChange,
  onSampleDataChange,
  maxHeight = 500,
  showValidation = true
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCopySchema = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [schema]);

  const validateSampleData = useCallback(() => {
    if (!sampleData || !schema) return { valid: true, errors: [] };
    
    // Basic validation - in production, use a proper JSON schema validator
    const errors: string[] = [];
    
    if (schema.required) {
      schema.required.forEach(field => {
        if (!(field in sampleData)) {
          errors.push(`Missing required field: ${field}`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }, [sampleData, schema]);

  const validation = showValidation ? validateSampleData() : { valid: true, errors: [] };

  return (
    <Paper sx={{ width: '100%', maxHeight }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {schema.title || 'JSON Schema'}
            </Typography>
            {schema.description && (
              <Typography variant="body2" color="text.secondary">
                {schema.description}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {validation.valid ? (
              <CheckCircle color="success" />
            ) : (
              <ErrorIcon color="error" />
            )}
            <IconButton size="small" onClick={handleCopySchema}>
              {copied ? <CheckCircle color="success" /> : <ContentCopy />}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Validation errors */}
      {!validation.valid && (
        <Alert severity="error" sx={{ m: 2, mb: 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Validation Errors:
          </Typography>
          {validation.errors.map((error, index) => (
            <Typography key={index} variant="body2">
              • {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Schema Structure" icon={<Visibility />} iconPosition="start" />
        <Tab label="Raw Schema" icon={<Code />} iconPosition="start" />
        {sampleData && (
          <Tab label="Sample Data" icon={<Edit />} iconPosition="start" />
        )}
      </Tabs>

      {/* Tab content */}
      <Box sx={{ maxHeight: maxHeight - 200, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          {/* Schema structure view */}
          {schema.properties ? (
            <Box>
              {Object.entries(schema.properties).map(([name, property]: [string, any]) => (
                <SchemaProperty
                  key={name}
                  name={name}
                  property={property}
                  required={schema.required?.includes(name)}
                />
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">
              No properties defined in schema
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Raw schema editor */}
          <JSONEditor
            value={schema}
            onChange={onSchemaChange || (() => {})}
            readOnly={!editable || !onSchemaChange}
            maxHeight={maxHeight - 250}
          />
        </TabPanel>

        {sampleData && (
          <TabPanel value={tabValue} index={2}>
            {/* Sample data editor */}
            <JSONEditor
              value={sampleData}
              onChange={onSampleDataChange || (() => {})}
              readOnly={!editable || !onSampleDataChange}
              maxHeight={maxHeight - 250}
            />
          </TabPanel>
        )}
      </Box>
    </Paper>
  );
};

export default JSONSchemaViewer;
