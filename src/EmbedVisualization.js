import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LookerEmbedLook, LookerEmbedSDK } from '@looker/embed-sdk';
import styled from 'styled-components';
import { ExtensionContext } from '@looker/extension-sdk-react';

const EmbedVisualizationContainer = styled.div`
    margin-top: -44px;
    visibility: ${(props) => (props.isEmbedVisible ? 'visible' : 'hidden')};
    opacity: ${(props) => (props.isEmbedVisible ? 1 : 0)};
    transition: opacity 1s ease-in-out;
    z-index: ${(props) => (props.isEmbedVisible ? 1 : -1)};
    & > iframe {
        background-color: #ffffff !important;
        border: none;
        width: 100%;
        height: calc(100vh - 72px);
    }
`;


const EmbedVisualization = ({
    model,
    explore,
    host,
    lookId,
    query,
    filters,
}) => {
    const [look, setLook] = useState();
    const extensionContext = useContext(ExtensionContext);
    const [running, setRunning] = useState(true);

    useEffect(() => {
        if (!running) {
            setTimeout(() => {
                handleSubmit();
            }, 5000);
        }
    }, [running]);

    const handleSubmit = async (e) => {
      look.updateFilters({
        'history.source': 'api4'
      });
      setTimeout(() => {
        look.run();
    }, 2000);
        
    };

    const embedCtrRef = useCallback(
        (el) => {
            const hostUrl =
                extensionContext?.extensionSDK?.lookerHostData?.hostUrl;
            if (el && hostUrl && lookId && host && extensionContext) {
                el.innerHTML = ''; // Clear the container
                LookerEmbedSDK.init(hostUrl);

                // const r = LookerEmbedSDK.createExploreWithUrl('')
                // console.log(r)
                // r.withUrl(`/embed/query/${model}/${explore}`)
                LookerEmbedSDK.createLookWithId(lookId)
                    .appendTo(el)
                    .withParams({ qid: query })
                    .withAllowAttr('fullscreen')
                    .on('page:changed', console.log)
                    .on('page:properties:changed', console.log)
                    .on('look:ready', console.log)
                    .on('look:run:start', console.log)
                    .on('look:run:complete', (e) => {
                        setRunning(false);
                        console.log(e);
                    })
                    .build()
                    .connect()
                    .then((look) => setLook(look))
                    .catch((error) => {
                        console.error('Connection error', error);
                    });
            }
        },
        [lookId]
    );

    return (
        <>
            <EmbedVisualizationContainer
                ref={embedCtrRef}
                isEmbedVisible={!running}
            ></EmbedVisualizationContainer>
        </>
    );
};

EmbedVisualization.propTypes = {
    host: PropTypes.string.isRequired,
    lookId: PropTypes.number.isRequired,
    query: PropTypes.string.isRequired,
    isEmbedVisible: PropTypes.bool.isRequired,
};

export default React.memo(EmbedVisualization);
// export default EmbedVisualization;
