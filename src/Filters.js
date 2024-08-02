import React, { useState, useEffect, useContext } from 'react';
import { Select, FieldText, Button } from '@looker/components';
import { ExtensionContext } from '@looker/extension-sdk-react';
import PopoverFilter from './PopoverFilter';
import styled from 'styled-components';

const FilterFlexHolder = styled.div`
/* Frame 1000006138 */

/* Auto layout */
display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;

width: 634px;
height: auto;

`


export const Filters = ({ isDashboardEditing, filterConfig, setFilterConfig, filterValues, setFilterValues, model, explore }) => {
	const {
		core40SDK,
	} = useContext(ExtensionContext);


	const [selectedField, setSelectedField] = useState('');
	const [configuredDashboardFilters, setConfiguredDashboardFilters] = useState([]);

	useEffect(() => {
		// Fetch eligible filter fields from the Looker API
		console.log('Fetching dashboard filter configs')
		core40SDK?.ok(core40SDK.dashboard('980', 'dashboard_filters')).then(response => {
			console.log('Configured filters:', response.dashboard_filters)
			setConfiguredDashboardFilters(response.dashboard_filters)
		})
	}, [core40SDK, model, explore]);


	const handleAddFilter = () => {
		console.log('selectedField', selectedField);
		console.log('configuredDashboardFilters', configuredDashboardFilters);
		const newFilterConfig = configuredDashboardFilters.filter((filter) => filter.id == (selectedField))
		if (!filterConfig || filterConfig.length === 0) {
			setFilterConfig([...newFilterConfig]);
		} else {
			setFilterConfig([...filterConfig, ...newFilterConfig]);
		}
		setSelectedField('');

		// determine if the filterConfig has a default, and add a filter value if it does
		console.log('newfilterconfig', newFilterConfig);
		if (newFilterConfig[0]?.default_value?.length > 0) {
			if (newFilterConfig[0]?.dimension?.length > 1) {
				setFilterValues({ ...filterValues, [newFilterConfig[0].dimension]: newFilterConfig[0].default_value })
			} else {
				setFilterValues({ ...filterValues, [newFilterConfig[0].measure]: newFilterConfig[0].default_value })
			}
		}
	};

	//   // Filter configuredDashboardFilters based on filterConfig
	//   const preconfiguredFilters = configuredDashboardFilters.filter((filter, index) => filterConfig?.includes(filter.id))

	return (
		<div>
			{isDashboardEditing && (
				<>
					Select an existing Dashboard filter below and click 'add filter' to add it to the tile.  After you add it here, you can remove it from the Dashboard.
					<Select
						name="filterField"
						value={selectedField}
						onChange={(value) => setSelectedField(value)}
						options={configuredDashboardFilters && configuredDashboardFilters.map(field => ({ value: field.id, label: field.title }))}
						placeholder="Select Filter Field"
					/>
					<Button onClick={handleAddFilter}>Add Filter</Button>
				</>)
			}
			{filterConfig && (
				<FilterFlexHolder>
					{filterConfig.map((filter, index) => (
					<PopoverFilter
						key={index}
						index={index}
						filter={filter}
						sdk={core40SDK}
						onChange={(e) => { console.log('TODO: filter value change should update local state only', e) }}
						expression={filter?.name ? filterValues[filter?.name] : ''}
					/>
					))}
				</FilterFlexHolder>
			)
		}

		</div>
	);
};

export default Filters;