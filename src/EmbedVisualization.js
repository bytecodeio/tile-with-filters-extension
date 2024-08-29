import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LookerEmbedLook, LookerEmbedSDK } from '@looker/embed-sdk';
import styled from 'styled-components';
import { ExtensionContext } from '@looker/extension-sdk-react';

// TODO: this should inherit the height of the filter elements, so that we can reduce height subtracted from the viewport height.
// for 1 layer of filters, 22px is enough, for 2 layers (3-4 filters), 50px is good.
const EmbedVisualizationContainer = styled.div`
    margin-top: -44px;
    transition: opacity 1s ease-in-out;
    z-index: -1;
    & > iframe {
        background-color: #ffffff !important;
        border: none;
        width: calc(100vw);
        height: calc(100vh - 50px);
    }
`;


const EmbedVisualization = ({
    model,
    explore,
    query,
}) => {
    const [embed, setEmbed] = useState();
    const extensionContext = useContext(ExtensionContext);

    useEffect(() => {
        console.log('embed mounted:', embed);
        if (embed) {
            setTimeout(() => {
                // handleSubmit();
            }, 10000);
        }
    }, [embed]);

    const handleSubmit = async (e) => {
        embed.updateFilters({
            'history.source': 'api4'
        });
        setTimeout(() => {
            embed.run();
        }, 2000);

    };

    const embedCtrRef = useCallback(
        (el) => {
            const hostUrl =
                extensionContext?.extensionSDK?.lookerHostData?.hostUrl;
            if (el && hostUrl && model && explore && query) {
                el.innerHTML = ''; // Clear the container
                LookerEmbedSDK.init(hostUrl);

                const r = LookerEmbedSDK.createExploreWithUrl('')

                r.withUrl(`${hostUrl}/embed/query/${model}/${explore}?qid=${query}&embed_domain=${hostUrl}`)
                    // LookerEmbedSDK.createLookWithId(lookId)
                    .appendTo(el)
                    .withAllowAttr('fullscreen')
                    .withParams({ qid: query })
                    .on('page:changed', console.log)
                    .on('page:properties:changed', console.log)
                    .on('explpre:ready', console.log)
                    .on('explore:run:start', console.log)
                    .on('explore:run:complete', console.log)
                    .build()
                    .connect()
                    .then((embed) => setEmbed(embed))
                    .catch((error) => {
                        console.error('Connection error', error);
                    });
                console.log(r)
            }
        },
        [model, explore, query]
    );

    return (
        <>
            <EmbedVisualizationContainer
                ref={embedCtrRef}
            />
        </>
    );
};

EmbedVisualization.propTypes = {
    model: PropTypes.string.isRequired,
    explore: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
};

export default React.memo(EmbedVisualization);
// export default EmbedVisualization;
