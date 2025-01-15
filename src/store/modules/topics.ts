import { ActionContext } from "vuex";
import { State as RootState } from "@/store";
import { ITopic } from "@/interfaces/api/v2/topic.interface";
import Topic from "@/services/api/v2/topic.service";
import V4Topic from "@/services/api/v4/topic.service";
import { ICredentialSet } from "@/interfaces/api/v2/credential-set.interface";

const topicService = new Topic();
const v4topicService = new V4Topic();

export interface State {
  selected: {
    topic: ITopic | null;
    credentialSet: ICredentialSet | null;
  };
}

const state: State = {
  selected: {
    topic: null,
    credentialSet: null,
  },
};

const getters = {
  selectedTopic: (state: State): ITopic | null => state?.selected?.topic,
  selectedTopicCredentialSet: (state: State): ICredentialSet | null =>
    state?.selected?.credentialSet,
  selectedTopicFullCredentialSet: (state: State): ICredentialSet | null =>
    state?.selected?.credentialSet,
};

const actions = {
  async fetchFormattedIdentifiedTopic(
    { commit }: ActionContext<State, RootState>,
    { sourceId, type }: { sourceId: string; type: string }
  ): Promise<void> {
    try {
      const res = await topicService.getFormattedIdentifiedTopic(
        sourceId,
        type
      );
      commit("setSelectedTopic", res.data);
    } catch (e) {
      console.error(e);
      commit("setSelectedTopic", null);
    }
  },
  async fetchTopicCredentialSet(
    { commit }: ActionContext<State, RootState>,
    id: number
  ): Promise<void> {
    try {
      const res = await topicService.getTopicCredentialSet(id);
      commit("setSelectedCredentialSet", res.data);
    } catch (e) {
      console.error(e);
      commit("setSelectedCredentialSet", null);
    }
  },

  async fetchTopicFullCredentialSet(
    { commit }: ActionContext<State, RootState>,
    id: number
  ): Promise<void> {
    try {
      const res = await v4topicService.getTopicCredentialSet(id);
      commit("setSelectedCredentialSet", res.data);
    } catch (e) {
      console.error(e);
      commit("setSelectedCredentialSet", null);
    }
  },
};

const mutations = {
  setSelectedTopic(state: State, topic: ITopic): void {
    state.selected = { ...state.selected, topic };
  },
  setSelectedCredentialSet(state: State, credentialSet: ICredentialSet): void {
    state.selected = {
      ...state.selected,
      credentialSet,
    };
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
