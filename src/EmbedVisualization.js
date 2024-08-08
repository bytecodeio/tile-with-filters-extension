import React  from 'react';
import PropTypes from 'prop-types';

const EmbedVisualization = ({ host, lookId, query }) => {

    // console.log('EmbedVisualization');
    // console.log('host', host);
    // console.log('lookId', lookId);
    // console.log('query', query);
    // final should look like this: https://bytecodeef.looker.com/embed/looks/251?qid=YSIsPiflZb0ZkcwP6b15Cm
 
    let newUrl = `https://${host}/embed/looks/${lookId}?qid=${query}`;

    console.log('newUrl', newUrl);
    return (
        <iframe
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

// export default React.memo(EmbedVisualization);
export default EmbedVisualization;