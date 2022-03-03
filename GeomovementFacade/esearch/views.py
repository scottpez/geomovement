import re

from django.shortcuts import render
from elasticsearch import Elasticsearch
from rest_framework.views import APIView
from rest_framework.response import Response


def index(req):
    return render(req, 'index.html')


class Geomovement(APIView):
    es = Elasticsearch()
    indexes = ['news', 'tweets', 'science']
    search_types = ['geostatement', 'geobin', 'suggest']
    negations = ['movement', 'nomovement']
    scales = ['states', 'continents', 'countries', 'bins1', 'bins2']

    def get(self, request, format=None):
        results = self.esearch(request.query_params)
        return Response(results)

    def validate(self, v, check_type):
        if check_type == 'searchtype':
            # it should be one of the predefined search types
            if v in self.search_types:
                return v
        if check_type == 'binorprob':
            # check for numbers separated by commas
            tester = re.compile(r'^[0-9]*$')
            vs = v.split(',')
            output = []
            for e in vs:
                if len(e) > 0 and tester.match(e):
                    output.append(int(e))
            return output
        if check_type == 'content':
            # return only letters and numbers with a max of 30 characters
            return (''.join(e for e in v if (e.isalnum() or e == ' ')))[:30]
        if check_type == 'yearmonth':
            # format should be 202005 for May, 2020
            year = int(v[0:4])
            month = int(v[4:6])
            if year >= 2019 and 12 >= month >= 1:
                return '%s-%s-%s' % (v[0:4], v[4:6], '01')
            else:
                return None
        if check_type == 'iname':
            # they should be one of the predefined index names
            vs = v.split(',')
            output = []
            for e in vs:
                if e in self.indexes:
                    output.append('geomovement_%s' % e)
            return output
        if check_type == 'negation':
            # they should be one of the predefined index names
            vs = v.split(',')
            output = []
            for e in vs:
                if e in self.negations:
                    output.append(e != 'movement')
            return output
        if check_type == 'scale':
            # they should be one of the predefined index names
            if v in self.scales:
                return v
            else:
                return None

    def build_geostatement_query(self, content, bins, time_start, time_end, movement_probability,
                                 negations, scale):
        size = 10000
        source = ["statementId", "content", "published", scale, "other%s" % scale.capitalize(), "url"]
        qs = []
        if content is not None and content != ' ':
            cq = {"match": {"content": content}}
            qs.append(cq)
        if bins is not None and len(bins) > 0:
            if len(bins) > 1:
                bq = {"bool": {"should": [{"term": {scale: int(bin)}} for bin in bins]}}
                qs.append(bq)
            if len(bins) == 1:
                bq = {"term": {scale: bins[0]}}
                qs.append(bq)
        if time_start is not None and time_end is not None:
            tq = {"range": {"published": {"gte": '%sT00:00:00' % time_start, "lte": '%sT00:00:00' % time_end}}}
            qs.append(tq)
        if len(movement_probability) > 1:
            mq = {"bool": {"should": [{"term": {"predClass": p}} for p in movement_probability]}}
            qs.append(mq)
        if len(movement_probability) == 1:
            mq = {"term": {"predClass": movement_probability[0]}}
            qs.append(mq)
        if len(negations) == 1:
            mq = {"term": {"negated": negations[0]}}
            qs.append(mq)
        if len(negations) == 0:
            mq = {"bool": {"must": [{"term": {"negated": n}} for n in negations]}}
            qs.append(mq)
        q1 = {"bool": {"must": qs}}
        sq = {"_source": source,
              "size": size,
              "query": q1}
        if bins is not None:
            sq['aggs'] = {
                "l_f": {"filter": q1,
                        "aggs": {"a_bi": {"terms": {"field": scale},
                                             "aggs": {"l_bi": {"terms": {"field": "contentBigrams", "size": 20}}}}
                                     }}}
        return sq

    def build_geobin_query(self, content, time_start, time_end, movement_probability,
                           negations, scale):
        size = 10000
        qs = []
        if content is not None and content != ' ':
            cq = {"match": {"content": content}}
            qs.append(cq)
        if time_start is not None and time_end is not None:
            tq = {"range": {"published": {"gte": '%sT00:00:00' % time_start, "lte": '%sT00:00:00' % time_end}}}
            qs.append(tq)
        if len(movement_probability) > 1:
            mq = {"bool": {"should": [{"term": {"predClass": p}} for p in movement_probability]}}
            qs.append(mq)
        if len(movement_probability) == 1:
            mq = {"term": {"predClass": movement_probability[0]}}
            qs.append(mq)
        if len(negations) == 1:
            mq = {"term": {"negated": negations[0]}}
            qs.append(mq)
        if len(negations) == 0:
            temp_negations = [True, False]
            mq = {"bool": {"must": [{"term": {"negated": n}} for n in temp_negations]}}
            qs.append(mq)
        q1 = {"bool": {"must": qs}}
        sq = {"size": 0,
              "aggs": {"l_f": {"aggs": {"l_b": {"terms": {"field": scale, "size": size}},
                                        "n": {"terms": {"field": "negated"},
                                              "aggs": {"n_d": {"terms": {"field": "yearMonth", "size": size}}}}}},
                       "l_t": {
                           "aggs": {"t_n": {"terms": {"field": "negated"},
                                            "aggs": {"t_n_d": {"terms": {"field": "yearMonth", "size": size}}}}}
                       }}}
        if len(q1) > 0:
            sq['aggs']['l_f']['filter'] = q1
            if len(movement_probability) > 1:
                mq = {"bool": {"must": [{"range": {"published": {"gte": '2019-08-01T00:00:00', "lte": '2025-01-01T00:00:00'}}},
                                        {"bool": {"should": [{"term": {"predClass": p}} for p in movement_probability]}}]}}
                sq['aggs']['l_t']['filter'] = mq
        return sq

    def build_suggest_query(self, content):
        size = 5
        sq = {"suggest": {"autosuggest": {
            "text": content,
            "term": {"field": "content", "size": size, "suggest_mode": "always"
                     }}}}
        return sq

    def get_geostatement_results(self, responses, scale, bins):
        results = {'s': [], 'bi': {}, 'b': bins}
        bi = {}
        for response in responses:
            for hit in response['hits']['hits']:
                doc = hit['_source']
                result = {
                    'id': doc['statementId'],
                    'c': doc['content'],
                    'p': doc['published'],
                    'b': doc[scale],
                    'ob': doc['other%s' % scale.capitalize()],
                    'u': doc['url']
                }
                results['s'].append(result)
            if 'aggregations' in response:
                for bucket in response['aggregations']['l_f']['a_bi']['buckets']:
                    key1 = str(bucket['key'])
                    for bucket2 in bucket['l_bi']['buckets']:
                        key = bucket2['key']
                        if key1 not in bi:
                            bi[key1] = {}

                        if key in bi[key1]:
                            bi[key1][key] += bucket2['doc_count']
                        else:
                            bi[key1][key] = bucket2['doc_count']

        # for b in bi.items():
            # bi[b[0]] = {k: v for k, v in sorted(b[1].items(), key=lambda item: item[1], reverse=True)}
        results['bi'] = bi
        return results

    def get_geobin_results(self, responses):
        results = {'l': {}, 'n': {}}
        for response in responses:
            for bucket in response['aggregations']['l_f']['l_b']['buckets']:
                key = bucket['key']
                if key in results['l']:
                    results['l'][key] += bucket['doc_count']
                else:
                    results['l'][key] = bucket['doc_count']
            for bucket1 in response['aggregations']['l_t']['t_n']['buckets']:
                key1 = bucket1['key']
                for bucket2 in bucket1['t_n_d']['buckets']:
                    key2 = bucket2['key']
                    key2 = '%s-%s' % (key2[0:4], key2[4:6])
                    neg = 'nm' if key1 == 1 else 'm'
                    o_neg = 'm' if key1 == 1 else 'nm'
                    if key2 in results['n']:
                        results['n'][key2]['t_%s' % neg] += bucket2['doc_count']
                    else:
                        results['n'][key2] = {'t_%s' % neg: bucket2['doc_count'], 't_%s' % o_neg: 0}
            for bucket1 in response['aggregations']['l_f']['n']['buckets']:
                key1 = bucket1['key']
                for bucket2 in bucket1['n_d']['buckets']:
                    key2 = bucket2['key']
                    key2 = '%s-%s' % (key2[0:4], key2[4:6])
                    neg = 'nm' if key1 == 1 else 'm'
                    o_neg = 'm' if key1 == 1 else 'nm'
                    if key2 in results['n']:
                        if 'f_%s' % neg in results['n'][key2]:
                            results['n'][key2]['f_%s' % neg] += bucket2['doc_count']
                        else:
                            results['n'][key2]['f_%s' % neg] = bucket2['doc_count']
                            results['n'][key2]['f_%s' % o_neg] = 0
        # results['l'] = {k: v for k, v in sorted(results['l'].items(), key=lambda item: item[1])}
        return results

    def get_suggest_results(self, responses):
        results = []
        for response in responses:
            for ele in response['suggest']['autosuggest'][0]['options']:
                suggest = ele['text']
                if suggest not in results:
                    results.append(suggest)
        return results

    def esearch(self, params):
        content = params.get('c', None)
        if content is not None:
            content = self.validate(content, 'content')
        bins = params.get('b', None)
        if bins is not None:
            bins = self.validate(bins, 'binorprob')
        time_start = params.get('ts', None)
        if time_start is not None:
            time_start = self.validate(time_start, 'yearmonth')
        time_end = params.get('te', None)
        if time_end is not None:
            time_end = self.validate(time_end, 'yearmonth')
        movement_probability = params.get('p', None)
        if movement_probability is not None:
            movement_probability = self.validate(movement_probability, 'binorprob')
        index_names = params.get('i', None)
        if index_names is not None:
            index_names = self.validate(index_names, 'iname')
        search_type = params.get('t', None)
        if search_type is not None:
            search_type = self.validate(search_type, 'searchtype')
        negations = params.get('n', None)
        if negations is not None:
            negations = self.validate(negations, 'negation')
        scale = params.get('s', None)
        if scale is not None:
            scale = self.validate(scale, 'scale')

        if search_type == 'geostatement':
            sq = self.build_geostatement_query(content, bins, time_start, time_end,
                                               movement_probability,
                                               negations, scale)
            responses = []
            for index_name in index_names:
                responses.append(self.es.search(index=index_name, body=sq, request_timeout=30))
            results = self.get_geostatement_results(responses, scale, bins)
        if search_type == 'geobin':
            sq = self.build_geobin_query(content, time_start, time_end,
                                         movement_probability, negations, scale)
            responses = []
            for index_name in index_names:
                responses.append(self.es.search(index=index_name, body=sq, request_timeout=30))
            results = self.get_geobin_results(responses)
        if search_type == 'suggest':
            sq = self.build_suggest_query(content)
            responses = []
            for index_name in index_names:
                responses.append(self.es.search(index=index_name, body=sq))
            results = self.get_suggest_results(responses)

        return results
