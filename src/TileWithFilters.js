import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import styled from 'styled-components';
import { ComponentsProvider, Heading, SpaceVertical, FieldText } from '@looker/components';
import { ExtensionContext } from '@looker/extension-sdk-react';
import Filters from './Filters';
import EmbedVisualization from './EmbedVisualization';

const TileFrame = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  gap: 9px;
  width: auto;
  height: auto;
  background: #FFFFFF;
  flex: none;
  order: 1;
  flex-grow: 1;
`;

const FiltersContainer = styled.div`
  width: 100%;
  padding-bottom: 7px;
  background-color: white;
  z-index: 2;
  position: relative;
`;

const TransitionContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  div {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity 1s ease-in-out;
  }
`;

export const TileWithFilters = () => {
  const {
    core40SDK,
    tileSDK,
    tileHostData,
    visualizationData,
    visualizationSDK,
    extensionSDK,
    lookerHostData
  } = useContext(ExtensionContext);

  const [initialLookId, setInitialLookId] = useState();
  const [initialQuery, setInitialQuery] = useState();
  const [client_id, setClient_id] = useState();
  const [filterConfig, setFilterConfig] = useState();
  const [filterValues, setFilterValues] = useState({});
  const [model, setModel] = useState();
  const [explore, setExplore] = useState();
  const [showInstructions, setShowInstructions] = useState(false);
  const [isEmbedVisible, setIsEmbedVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { dashboardFilters, elementId, isDashboardEditing, dashboardId } = tileHostData;
  const toggleInstructions = useCallback(() => {
    setShowInstructions(prev => !prev);
  }, []);

  const createFinalQuery = useCallback(async (initialQueryOverride = null, filterValuesOverride = null) => {
    if (!initialQuery && !initialQueryOverride) {
      console.error('No initial query provided');
      return;
    }

    const query = initialQueryOverride || initialQuery;
    const filters = filterValuesOverride || filterValues;

    console.log('Creating final query with filters', filters);
    !model && query?.model && setModel(query.model);
    !explore && query?.view && setExplore(query.view);

    if (!filters || Object.keys(filters).length === 0) {
      console.log('No filters to apply, using initial query');
      query && setClient_id(query.client_id);
    } else {
      console.log('Applying filters to query');
      const { client_id, id, can, slug, expanded_share_url, ...strippedQuery } = query;
      const newQueryData = {
        ...strippedQuery,
        filters: {
          ...filters
        },
      };
      const newQuery = await core40SDK.ok(core40SDK.create_query(newQueryData));
      console.log('newQuery', newQuery);
      newQuery && setClient_id(newQuery.client_id);
    }
  }, [filterValues, model, explore, initialQuery]);

  const persistStateToContext = useCallback(async () => {
    if (!elementId) {
      console.error('No elementId found in tileHostData, skipping persistStateToContext');
      return;
    }

    const contextData = extensionSDK.getContextData();
    const newFilterElementId = tileHostData.elementId + ':filterConfig';
    const newLookElementId = tileHostData.elementId + ':lookId';
    const initialQueryElementId = tileHostData.elementId + ':initialQuery';

    let revisedContextData = { ...contextData };

    if (filterConfig) {
      revisedContextData[newFilterElementId] = JSON.parse(JSON.stringify(filterConfig));
    }
    revisedContextData[newLookElementId] = initialLookId;

    const unfilteredQueryResponse = await core40SDK.ok(core40SDK.look(
      initialLookId, 'query'))
    const unfilteredQuery = unfilteredQueryResponse?.query
    revisedContextData[initialQueryElementId] = unfilteredQuery;
    console.log('persisting context data', revisedContextData);
    extensionSDK.saveContextData(revisedContextData);
  }, [elementId, filterConfig, initialLookId, tileHostData.elementId, extensionSDK]);

  const persistClientIdToContext = useCallback(async () => {
    if (!elementId) {
      console.error('No elementId found in tileHostData, skipping persistStateToContext');
      return;
    }

    const contextData = extensionSDK.getContextData();
    const newClientId = tileHostData.elementId + ':clientId';
    let revisedContextData = { ...contextData };

    if (client_id) {
      revisedContextData[newClientId] = client_id;
    }

    console.log('persisting client_id to context', revisedContextData);
    extensionSDK.saveContextData(revisedContextData);
  }, [client_id, elementId, extensionSDK, tileHostData.elementId]);

  const hasPersistedClientId = useRef(false);

  const populateStateFromContext = useCallback(async () => {
    const elementId = tileHostData.elementId;
    if (!elementId) {
      console.error('No elementId found in tileHostData, skipping populateStateFromContext');
      return;
    }
    const contextData = await extensionSDK.getContextData();
    console.log('populating state from context', contextData);
    const newFilterConfigElementId = elementId + ':filterConfig';
    const newLookID = elementId + ':lookId';
    const newClientId = elementId + ':clientId';
    const initialQueryElementId = elementId + ':initialQuery';

    if (!contextData) {
      extensionSDK.saveContextData({});
      console.error('No context data found in populateStateFromContext');
      return;
    }
    console.log('setting client_id from context', contextData[newClientId]);
    setInitialLookStateSimultaneously(contextData[newLookID], contextData[newClientId], contextData[initialQueryElementId]);

    if (contextData[newFilterConfigElementId] && contextData[newFilterConfigElementId].length > 0) {
      setFilterConfig(contextData[newFilterConfigElementId]);
    }

    visualizationData && setInitialQuery(visualizationData.query);
  }, [extensionSDK, tileHostData.elementId]);

  const setInitialLookStateSimultaneously = useCallback((lookId, client_id, query) => {
    setClient_id(client_id);
    setInitialLookId(lookId);
    setInitialQuery(query);
  }, []);

  useEffect(() => {
    if (tileHostData.elementId) populateStateFromContext();
  }, [tileHostData.elementId, populateStateFromContext]);

  useEffect(() => {
    if (client_id && initialLookId) {
      const timer = setTimeout(() => {
        setIsEmbedVisible(true);
        setIsLoading(false);
      }, 7000); // 7 seconds delay
      return () => clearTimeout(timer);
    }
  }, [client_id, initialLookId]);

  useEffect(() => {
    if (initialLookId || filterConfig) persistStateToContext();
  }, [initialLookId, filterConfig, tileHostData.elementId, persistStateToContext]);

  useEffect(() => {
    if (client_id && !hasPersistedClientId.current) {
      persistClientIdToContext();
      hasPersistedClientId.current = true;
    }
  }, [client_id, persistClientIdToContext]);

  useEffect(() => {
    console.log('going to create final query with filter values;', filterValues);
    createFinalQuery();
  }, [filterValues, createFinalQuery]);


  const LoadingIcon = styled.div`
    display: ${props => (props.isLoading ? 'block' : 'none')};
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    color: #000;
  `;

  const isSaved = Number.isInteger(Number(elementId));

  const embedVisualizationProps = useMemo(() => ({
    host: lookerHostData.hostOrigin.replace('https://', ''),
    lookId: initialLookId,
    query: client_id
  }), [initialLookId, client_id]);

  return (
    <ComponentsProvider>
      <TileFrame>
        {isDashboardEditing && (!isSaved || showInstructions) && (
          <div>
            <Heading>Looker Visualization Component With Filters</Heading>
            <h4>Instructions</h4>
            <p>
              This extension requires a few steps for configuration:
            </p>
            <ol>
              <li>Save the dashboard with this extension tile.</li>
              <li>Configure the 'starting' tile. This is the visualization you want to add filters to.
                <ol>
                  <li>Create the visualization tile in an explore.</li>
                  <li>Add the tile to this Dashboard.</li>
                  <li>Also save the tile as a Look.</li>
                  <li>Note the Look Id.</li>
                  <li>Remove any dynamic filters from the Look.</li>
                </ol>
              </li>
              <li>Configure the extension tile with filters
                <ol>
                  <li>Copy the Look Id into the Look ID field.</li>
                  <li>Add filters to the dashboard, configured exactly as you want them to appear in the tile.</li>
                  <li>Select the filters from the top of the dashboard and click 'Add Filter'.</li>
                  <li>Remove the filters from the dashboard (they are now in the tile).</li>
                </ol>
              </li>
              <li>Save the dashboard.</li>
            </ol>
          </div>
        )}
        {isDashboardEditing && isSaved && (
          <SpaceVertical>
            <button onClick={toggleInstructions}>
              {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
            </button>

            <FieldText
              name="lookId"
              value={initialLookId}
              onChange={(event) => setInitialLookId(Number(event.target.value))}
              label="Look ID - Copy the id from a Look URL and paste it here."
            />
          </SpaceVertical>
        )}
        {isSaved && (
          <FiltersContainer>
            <Filters
              isDashboardEditing={isDashboardEditing}
              filterConfig={filterConfig}
              setFilterConfig={setFilterConfig}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
              model={model}
              explore={explore}
              dashboardId={dashboardId}
            />
          </FiltersContainer>
        )}
        <TransitionContainer isEmbedVisible={isEmbedVisible}>
          <LoadingIcon isLoading={isLoading}>Loading...</LoadingIcon>
          {client_id && initialLookId && (
              <EmbedVisualization isEmbedVisible={true} {...embedVisualizationProps}               model={model}
              explore={explore} />
          )}
        </TransitionContainer>
      </TileFrame>
    </ComponentsProvider>
  );
};

export default TileWithFilters;