import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Select, FieldText, Button, SpaceVertical } from '@looker/components';
import { ExtensionContext } from '@looker/extension-sdk-react';
import PopoverFilter from './PopoverFilter';
import styled from 'styled-components';

const FilterFlexHolder = styled.div`
/* Auto layout */
display: grid;
  grid-template-columns: ${({ isFullScreen }) => isFullScreen ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)'};
  max-width: 100%;
  height: auto;
  gap: 10px;
  margin-right: 20px; /* Add right margin */
  @media (max-width: 700px) {
    grid-template-columns: ${({ isFullScreen }) => isFullScreen ? 'repeat(auto-fit, minmax(50px, 1fr))' : 'repeat(auto-fit, minmax(100px, 1fr))'};
  }
`

export const Filters = ({ isDashboardEditing, filterConfig, setFilterConfig, filterValues, setFilterValues, model, explore, dashboardId, isFullScreen }) => {
	const {
		core40SDK,
	} = useContext(ExtensionContext);

	const [nameForAllCategories, setNameForAllCategories] = useState('');
	const [selectedField, setSelectedField] = useState('');
	const [configuredDashboardFilters, setConfiguredDashboardFilters] = useState([]);
    console.log('is full screen:', isFullScreen);
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
		const allCategories = filter.nameForAllCategories;
		setFilterValues((prevFilterValues) => {
			let newFilterValues = { ...prevFilterValues };


			console.log('previous Filters:', prevFilterValues);
			console.log('Setting filter value:', viewFieldId, value);

			newFilterValues[viewFieldId] = value;
			setFilterValues(newFilterValues);
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
					{(configuredDashboardFilters.find(filter => Number(filter.id) === Number(selectedField))?.ui_config?.type === 'checkboxes' ||
						configuredDashboardFilters.find(filter => Number(filter.id) === Number(selectedField))?.ui_config?.type === 'tag_list') && (
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
				<FilterFlexHolder isFullScreen={isFullScreen}>
					{filterConfig.map((filter, index) => {
						const filterKey = filter.dimension ? `${filter.dimension}` : `${filter.measure}`;

						// Find the corresponding value in filterValues
						const filterValue = filterValues[filterKey];

						return (
							<PopoverFilter
								key={index}
								index={index}
								filter={filter}
								sdk={core40SDK}
								changeHandler={getFieldFilterChangeHandler(filter)}
								expression={filterValue}
								nameForAllCategories={filter.nameForAllCategories || ''}
							// filterValue={{filterKey: filterValue}}
							/>
						)
					})}
				</FilterFlexHolder>
			)
			}

		</div>
	);
};

export default React.memo(Filters);