const connection = require('../database/connection');

module.exports = {
  async index(request, response) {
    const { page = 1 } = request.query; // get 'page' query param, if doesn't exist, it'll be 1

    const [count] = await connection('incidents').count();

    const incidents = await connection('incidents')
      .join('ongs', 'ongs.id', '=', 'incidents.ong_id')
      .limit(5)
      .offset((page - 1) * 5) // <- pagination
      .select([
        'incidents.*',
        'ongs.name',
        'ongs.email',
        'ongs.whatsapp',
        'ongs.city',
        'ongs.uf'
      ]); // <- chooses the data to be selected 

    response.header('X-Total-Count', count['count(*)']); // <- includes the total of table registers in the response header

    return response.json(incidents);
  },
  
  async create(request, response) {
    const { title, description, value } = request.body;
    const ong_id = request.headers.authorization;

    const [id] = await connection('incidents').insert({
      title,
      description,
      value,
      ong_id,
    });
    
    return response.json({ id });
  },

  async delete(request, response) {
    const { id } = request.params;
    const ong_id = request.headers.authorization;

    const incident = await connection('incidents')
      .where('id', id)
      .select('ong_id')
      .first(); // -> get the ong_id from the only incident with said id

    if (incident.ong_id !== ong_id) { 
      return response.status(401).json({ error: 'Operation not permitted' });
    } // -> if the logged ong isn't the same as the one that created the incident, it can't be deleted

    await connection('incidents').where('id', id).delete();

    return response.status(204).send(); // Status 204 is to responses with No Content
  }
};