import React, {useEffect}  from 'react';
import PropTypes from 'prop-types';

const EmbedVisualization = ({ host, lookId, query }) => {

    // console.log('EmbedVisualization');
    // console.log('host', host);
    // console.log('lookId', lookId);
    // console.log('query', query);
    // final should look like this: https://bytecodeef.looker.com/embed/looks/251?qid=YSIsPiflZb0ZkcwP6b15Cm
 
    // const embed_domain = encodeURIComponent('https://08a3f26b-1284-4ec8-8090-50d0bb378159-extensions.cloud.looker.com');
    // let newUrl = `https://${host}/embed/looks/${lookId}?qid=${query}&sdk=2&embed_domain=${embed_domain}`;
    // console.log('newUrl', newUrl);

    let newUrl = `https://${host}/embed/looks/${lookId}?qid=${query}`;


    useEffect(() => {
        const handleIframeMessage = (event) => {
            // Ensure the message is coming from the expected origin
            if (event.origin !== `https://${host}`) {
                return;
            }

            // Handle the message
            // console.log('Message from iframe:', event.data);
            // Add your custom logic here
        };

        // Add event listener for messages from the iframe
        window.addEventListener('message', handleIframeMessage);

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener('message', handleIframeMessage);
        };
    }, [host]);

    return (
        <iframe
            id='embedLook'
            src={newUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            title="Looker Visualization"
            style={{
                marginTop: '-44px',
                backgroundColor: '#ffffff !important', // Ensure the iframe background is transparent
                border: 'none', // Remove any default border
                width: '100%', // Ensure the iframe takes full width
                height: 'calc(100vh - 72px)' // Ensure the iframe takes full height
            }}
        ></iframe>
    )

};

EmbedVisualization.propTypes = {
    host: PropTypes.string.isRequired,
    lookId: PropTypes.number.isRequired,
    query: PropTypes.string.isRequired
};

export default React.memo(EmbedVisualization);
// export default EmbedVisualization;