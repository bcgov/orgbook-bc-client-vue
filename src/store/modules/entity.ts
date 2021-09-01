import { ActionContext } from "vuex";
import { State as RootState } from "@/store/index";
import Relationship from "@/services/api/v2/relationship.service";
import { ITopic } from "@/interfaces/api/v2/topic.interface";
import { IEntityFacetField } from "@/interfaces/entity-filter.interface";
import { ICredentialSet } from "@/interfaces/api/v2/credential-set.interface";
import { ICredentialDisplayType } from "@/interfaces/api/v4/credential.interface";
import { isRegType } from "@/utils/entity";

export type Filter = { [key: string]: string | Array<string> | boolean };

const relationshipService = new Relationship();

export interface State {
  relationships: Relationship[];
  selected: {
    topic: ITopic | null;
    credentialSet: ICredentialSet | null;
  };
  entityFilter: Filter | null;
  filterValues: {
    authorities: Array<IEntityFacetField>;
    credentialType: Array<IEntityFacetField>;
    registrationType: Array<IEntityFacetField>;
  };
}

const state: State = {
  relationships: [],
  selected: {
    topic: null,
    credentialSet: null,
  },
  entityFilter: null,
  filterValues: {
    authorities: [],
    credentialType: [],
    registrationType: [],
  },
};

const getters = {
  entityTest: (state: State): State => state,
  getRelationships: (state: State): Relationship[] => state.relationships,
  getAuthorities: (state: State): Array<IEntityFacetField> =>
    state.filterValues.authorities,
  getCredentialTypes: (state: State): Array<IEntityFacetField> =>
    state.filterValues.credentialType,
  getRegistrationTypes: (state: State): Array<IEntityFacetField> =>
    state.filterValues.registrationType,
  getEntityFilters: (state: State): Filter => {
    if (!state.entityFilter) {
      return {
        Authorities: [],
        Credential_type: [],
        Registration_type: [],
        Date_min: "",
        Date_max: "",
        Show_expired: true,
      };
    } else {
      return state.entityFilter;
    }
  },
};

const actions = {
  async fetchRelationships(
    { commit }: ActionContext<State, RootState>,
    topic_id: number
  ): Promise<void> {
    try {
      const res = await relationshipService.getRelatedTo(topic_id);
      commit("setRelationships", res.data);
    } catch (e) {
      console.error(e);
    }
  },

  //entity filter actions
  setIssuers(
    { commit }: ActionContext<State, RootState>,
    creds: Array<ICredentialDisplayType>
  ): void {
    const filterFields: IEntityFacetField[] = [];

    creds.forEach((cred) => {
      const idx = filterFields
        .map((field) => field.value)
        .indexOf(cred.authority);
      if (idx >= 0) {
        (filterFields[idx].count as number) += 1;
      } else {
        filterFields.push({
          text: cred.authority,
          value: cred.authority,
          count: 1,
        });
      }
    });
    commit("setIssuers", filterFields);
  },
  setCredentialType(
    { commit }: ActionContext<State, RootState>,
    creds: Array<ICredentialDisplayType>
  ): void {
    const filterFields: IEntityFacetField[] = [];

    creds.forEach((cred) => {
      const idx = filterFields
        .map((field) => field.value)
        .indexOf(cred.credential_type);
      if (idx >= 0) {
        (filterFields[idx].count as number) += 1;
      } else {
        filterFields.push({
          text: cred.credential_type,
          value: cred.credential_type,
          count: 1,
        });
      }
    });
    commit("setCredTypes", filterFields);
  },

  setRegistrationType(
    { commit }: ActionContext<State, RootState>,
    creds: Array<ICredentialDisplayType>
  ): void {
    const filterFields: IEntityFacetField[] = [];

    creds.forEach((cred) => {
      if (isRegType(cred)) {
        const regDesc = cred.registration_reason;
        if (regDesc !== undefined) {
          const idx = filterFields.map((field) => field.value).indexOf(regDesc);
          if (idx >= 0) {
            (filterFields[idx].count as number) += 1;
          } else {
            filterFields.push({
              text: regDesc,
              value: regDesc,
              count: 1,
            });
          }
        }
      }
    });

    commit("setRegTypes", filterFields);
  },

  setFilter({ commit }: ActionContext<State, RootState>, filter: Filter): void {
    commit("setFilter", filter);
  },
  toggleEntityFilter(
    { commit }: ActionContext<State, RootState>,
    params: { filterString: string; filterField: string }
  ): void {
    const baseFilter = getters.getEntityFilters(state);
    let currFilters: string[] | string | boolean =
      baseFilter[params.filterField] === undefined
        ? []
        : baseFilter[params.filterField];
    if (typeof currFilters === "string" && currFilters !== "") {
      //we should only support clearing strings, adding strings should be done through setFilter
      currFilters = "";
    } else if (typeof currFilters === "boolean") {
      currFilters = !currFilters;
    } else {
      currFilters = currFilters as string[];
      if (!currFilters.includes(params.filterString)) {
        currFilters.push(params.filterString);
      } else {
        const idx = currFilters.indexOf(params.filterString);
        currFilters.splice(idx, 1);
      }
    }
    baseFilter[params.filterField] = currFilters;
    commit("setFilter", baseFilter);
  },
};

const mutations = {
  setRelationships: (state: State, relationships: Relationship[]): void => {
    state.relationships = relationships;
  },

  //entity filter mutations
  setCredTypes(state: State, credTypes: IEntityFacetField[]): void {
    state.filterValues.credentialType = credTypes;
  },
  setIssuers(state: State, issuers: IEntityFacetField[]): void {
    state.filterValues.authorities = issuers;
  },
  setRegTypes(state: State, regTypes: IEntityFacetField[]): void {
    state.filterValues.registrationType = regTypes;
  },
  setFilter: (state: State, filter: Filter): Filter | null => {
    state.entityFilter = { ...filter };
    return state.entityFilter;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
