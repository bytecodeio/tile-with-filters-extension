import React, { useState, useEffect } from 'react';
import { Select, FieldText, Button } from '@looker/components';

export const Filters = ({ sdk, filterConfig, setFilterConfig, filterValues, setFilterValues, model, explore }) => {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [fieldValue, setFieldValue] = useState('');

  useEffect(() => {
	// Fetch eligible filter fields from the Looker API
	sdk && sdk.ok(sdk.lookml_model_explore({
        lookml_model_name: model,
        explore_name: explore
      }))
	  .then(response => {
        console.log('Fields response:', response);
		setFields(response.fields.dimensions); // Adjust based on the actual response structure
	  })
	  .catch(error => console.error('Error fetching fields:', error));
  }, [sdk]);

  const handleAddFilter = () => {
	setFilterConfig([...filterConfig, selectedField]);
	setFilterValues({ ...filterValues, [selectedField]: fieldValue });
	setSelectedField('');
	setFieldValue('');
  };

  return (
	<div>
	  <Select
		name="filterField"
		value={selectedField}
		onChange={(value) => setSelectedField(value)}
		options={fields && fields.map(field => ({ value: field.name, label: field.label }))}
		placeholder="Select Filter Field"
	  />
	  <FieldText
		name="filterValue"
		value={fieldValue}
		onChange={(e) => setFieldValue(e.target.value)}
		label="Filter Value"
	  />
	  <Button onClick={handleAddFilter}>Add Filter</Button>
	  <div>
		{filterConfig && filterConfig.map((field, index) => (
		  <div key={index}>
			<strong>{field}</strong>: {filterValues[field]}
		  </div>
		))}
	  </div>
	</div>
  );
};

export default Filters;