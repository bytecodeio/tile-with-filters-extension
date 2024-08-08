import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Select, FieldText, Button, SpaceVertical } from '@looker/components';
import { ExtensionContext } from '@looker/extension-sdk-react';
import PopoverFilter from './PopoverFilter';
import styled from 'styled-components';

const FilterFlexHolder = styled.div`
/* Auto layout */
display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;

max-width: 634px;
height: auto;

`


export const Filters = ({ isDashboardEditing, filterConfig, setFilterConfig, filterValues, setFilterValues, model, explore, dashboardId }) => {
	const {
		core40SDK,
	} = useContext(ExtensionContext);

	const [nameForAllCategories, setNameForAllCategories] = useState('');
	const [selectedField, setSelectedField] = useState('');
	const [configuredDashboardFilters, setConfiguredDashboardFilters] = useState([]);

	useEffect(() => {
		// Fetch eligible filter fields from the Looker API
		// console.log('Fetching dashboard filter configs')
		if (dashboardId && core40SDK) {
			core40SDK?.ok(core40SDK.dashboard(dashboardId, 'dashboard_filters')).then(response => {
				// console.log('Configured filters:', response.dashboard_filters)
				setConfiguredDashboardFilters(response.dashboard_filters)
			})
		}
	}, [core40SDK, dashboardId]);


	const handleAddFilter = () => {
		const newFilterConfig = configuredDashboardFilters.find((filter) => filter.id == (selectedField))
		if (nameForAllCategories) {
			newFilterConfig.nameForAllCategories = nameForAllCategories;
		}
		if (!filterConfig || filterConfig.length === 0) {
			setFilterConfig([newFilterConfig]);
		} else {
			setFilterConfig([...filterConfig, newFilterConfig]);
		}
		setSelectedField('');
		setNameForAllCategories('');

		// determine if the filterConfig has a default, and add a filter value if it does
		if (newFilterConfig?.default_value?.length > 0) {
			if (newFilterConfig?.dimension?.length > 1) {
				setFilterValues({ ...filterValues, [newFilterConfig.dimension]: newFilterConfig.default_value })
			} else {
				setFilterValues({ ...filterValues, [newFilterConfig.measure]: newFilterConfig.default_value })
			}
		}
	};

	//   // Filter configuredDashboardFilters based on filterConfig
	//   const preconfiguredFilters = configuredDashboardFilters.filter((filter, index) => filterConfig?.includes(filter.id))

	const getFieldFilterChangeHandler = (filter) => (value) => {
		// The view and field are separated by a period. The field may come from a dimension or a measure
		const viewFieldId = filter.dimension ? `${filter.dimension}` : `${filter.measure}`;
		setFilterValues((prevFilterValues) => {
			const newFilterValues = { ...prevFilterValues };
			console.log('previous Filters:', prevFilterValues);
			console.log('Setting filter value:', viewFieldId, value);
			newFilterValues[viewFieldId] = value;
			console.log('new Filters:', newFilterValues);
			return newFilterValues;
		  });
	  }

	return (
		<div>
			{isDashboardEditing && (
				<SpaceVertical>
					Select an existing Dashboard filter below and click 'add filter' to add it to the tile.  After you add it here, you can remove it from the Dashboard.
					<Select
						name="filterField"
						value={selectedField}
						onChange={setSelectedField}
						options={configuredDashboardFilters && configuredDashboardFilters.map(field => ({ value: field.id, label: field.title }))}
						placeholder="Select Filter Field"
					/>
				{console.log('configuredDashboardFilters and selected field', configuredDashboardFilters, selectedField)}
				{console.log(configuredDashboardFilters.find(filter => Number(filter.id) == Number(selectedField)))}
					{configuredDashboardFilters.find(filter => Number(filter.id) === Number(selectedField))?.ui_config?.type === 'checkboxes' && (
						<FieldText
							label="Name for All Categories. Leave blank if you don't want an 'All' category."
							value={nameForAllCategories}
							onChange={e => setNameForAllCategories(e.target.value)}
						/>
					)}
					<Button onClick={handleAddFilter}>Add Filter</Button>
				</SpaceVertical>)
			}
			{filterConfig && (
				<FilterFlexHolder>
					{filterConfig.map((filter, index) => (
					<PopoverFilter
						key={index}
						index={index}
						filter={filter}
						sdk={core40SDK}
						changeHandler={getFieldFilterChangeHandler(filter)}
						expression={filter.name ? filterValues[filter?.name] : ''}
						nameForAllCategories={filter.nameForAllCategories || ''}
					/>
					))}
				</FilterFlexHolder>
			)
		}

		</div>
	);
};

export default React.memo(Filters);