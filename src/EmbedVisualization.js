import React  from 'react';
import PropTypes from 'prop-types';

const EmbedVisualization = ({ embedUrl, lookId, query }) => {


    // embedUrl should look like this:   "embed_url": "https://bytecodeef.looker.com/embed/public/JSMR9XqKpMbmNVgCzhtBB4zRSfDnWfFM",
    // look id is an integer like 251
    // query should look like this: YSIsPiflZb0ZkcwP6b15Cm
    // final should look like this: https://bytecodeef.looker.com/embed/looks/251?qid=YSIsPiflZb0ZkcwP6b15Cm
    
    let url = new URL(embedUrl);
    let host = url.host;
    let newUrl = `https://${host}/embed/looks/${lookId}?toggle=fil%2Cpik&qid=${query}`;

    return (
        <iframe
            src={newUrl}
            width="100%"
            height="600px"
            frameBorder="0"
            allowFullScreen
            title="Looker Visualization"
        ></iframe>
    )

};

EmbedVisualization.propTypes = {
    query: PropTypes.string.isRequired,
    embedUrl: PropTypes.string.isRequired,
    lookId: PropTypes.number.isRequired
};

export default React.memo(EmbedVisualization);