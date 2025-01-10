package app.affine.pro.service

import com.apollographql.apollo.ApolloCall
import com.apollographql.apollo.ApolloClient
import com.apollographql.apollo.api.Mutation
import com.apollographql.apollo.api.Query
import com.apollographql.apollo.api.Subscription

object AffineClient {

    private const val AFFINE_URL = "https://app.affine.pro/graphql"

    private val _client: ApolloClient by lazy {
        ApolloClient.Builder().serverUrl(AFFINE_URL).build()
    }


    fun <D : Query.Data> query(query: Query<D>): ApolloCall<D> {
        return _client.query(query)
    }

    fun <D : Mutation.Data> mutation(mutation: Mutation<D>): ApolloCall<D> {
        return _client.mutation(mutation)
    }

    fun <D : Subscription.Data> subscription(subscription: Subscription<D>): ApolloCall<D> {
        return _client.subscription(subscription)
    }
}